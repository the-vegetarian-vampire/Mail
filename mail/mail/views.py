import json
# import os
import send2trash
import time

from ml_spam import predict


import mailbox as MailBox
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.db import models
from django.http import JsonResponse
from django.shortcuts import HttpResponse, HttpResponseRedirect, render
from django.urls import reverse
from django.contrib import messages 
from django.views.decorators.csrf import csrf_exempt

from .models import User, Email


def index(request):

    # Authenticated users view their inbox
    if request.user.is_authenticated:
        return render(request, "mail/inbox.html")

    # Everyone else is prompted to sign in
    else:
        return HttpResponseRedirect(reverse("login"))


@csrf_exempt
@login_required
def compose(request):

    # Composing a new email must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    # Check recipient emails
    data = json.loads(request.body)
    emails = [email.strip() for email in data.get("recipients").split(",")]

    if emails == [""]:
        return JsonResponse({
            "error": "At least one recipient required."
        }, status=400)

    # Convert email addresses to users
    recipients = []
    for email in emails:
        try:
            user = User.objects.get(email=email)
            recipients.append(user)
        except User.DoesNotExist:
            messages.error(request, f"User with email \"{email}\" does not exist.")
            return JsonResponse({
                "error": f"User email \"{email}\" does not exist."
            }, status=400)

    # Get contents of email
    subject = data.get("subject", "")
    body = data.get("body", "")
    attachments = data.get("attachments", "")

    # Create one email for each recipient, plus sender
    mbox_file_path = f'./inbox_{subject}.mbox' 
    mbox = MailBox.mbox(mbox_file_path)
    email = MailBox.mboxMessage()
    email['From'] = request.user.email
    email['To'] = ", ".join(emails)
    email['Subject'] = subject
    email['Attachments'] = attachments
    email.set_payload(body)  
    mbox.add(email)
    mbox.flush()  # Save the mbox file

    # call detect_spam function from machinelearning.py and delete mbox file
    try:
        test_data = MailBox.mbox(mbox_file_path)
        spam = predict(test_data)
    finally:
        time.sleep(1) 
        # send2trash.send2trash(mbox_file_path)
        # os.remove(mbox_file_path)

    users = set()
    users.add(request.user)
    users.update(recipients)

    for user in users:
        email = Email(
            user=user,
            sender=request.user,
            subject=subject,
            attachments=attachments,
            body=body,
            read=user == request.user,
            spam=spam
        )
        email.save()
        for recipient in recipients:
            email.recipients.add(recipient)
        email.save()
    return JsonResponse({"message": "Email sent."}, status=201)


@login_required
def mailbox(request, mailbox):

    # Filter emails returned based on mailbox
    if mailbox == "inbox":
        emails = Email.objects.filter(
            user=request.user, recipients=request.user, archived=False
        )  
    elif mailbox == "sent":
        emails = Email.objects.filter(
            user=request.user, sender=request.user
        )
    elif mailbox == "archive":
        emails = Email.objects.filter(
            user=request.user, recipients=request.user, archived=True , spam=False
        )
    elif mailbox == "spam":
        emails = Email.objects.filter(
            user=request.user, recipients=request.user, spam=True
        )
    elif mailbox == "analytics":
        emails_spam = Email.objects.filter(
            user=request.user, recipients=request.user, spam=True
        )
        emails = Email.objects.filter(
            user=request.user, recipients=request.user
        )

        count_emails_spam = emails_spam.count()
        count_emails = emails.count()

        response_data = {
        "count_emails_spam": count_emails_spam,
        "count_emails": count_emails,
        "emails": [email.serialize() for email in emails]
        }

        return JsonResponse(response_data, safe=False)
    
    else:
        return JsonResponse({"error": "Invalid mailbox."}, status=400)

    # Return emails in reverse chronologial order
    emails = emails.order_by("-timestamp").all()
    return JsonResponse([email.serialize() for email in emails], safe=False )


@csrf_exempt
@login_required
def email(request, email_id):

    # Query for requested email
    try:
        email = Email.objects.get(user=request.user, pk=email_id)
    except Email.DoesNotExist:
        return JsonResponse({"error": "Email not found."}, status=404)

    # Return email contents
    if request.method == "GET":
        return JsonResponse(email.serialize())

    # Update whether email is read or should be archived
    elif request.method == "PUT":
        data = json.loads(request.body)
        if data.get("read") is not None:
            email.read = data["read"]
        if data.get("archived") is not None:
            email.archived = data["archived"]
        email.save()
        return HttpResponse(status=204)

    # Email must be via GET or PUT
    else:
        return JsonResponse({
            "error": "GET or PUT request required."
        }, status=400)


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        email = request.POST["email"]
        password = request.POST["password"]
        user = authenticate(request, username=email, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "mail/login.html", {
                "message": "Invalid email and/or password."
            })
    else:
        return render(request, "mail/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "mail/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(email, email, password)
            user.save()
        except IntegrityError as e:
            print(e)
            return render(request, "mail/register.html", {
                "message": "Email address already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "mail/register.html")
