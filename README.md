## Mail
Project 3 for Harvard's CS50w Web Programming with Python and JavaScript.

📹 `Youtube:` https://www.youtube.com/watch?v=hl1I_ZpIjVg

### Overview:
A single page front-end application for an email client that makes API calls to send and receive emails.

### Specifications:
Built with `Javascript`, `Python`, `Django`, `HTML/CSS`, `Bootstrap`, and `SQLite`.

The website never reloads, meaning it does not request multiple html pages, everything is done via JavaScript to update the DOM.

### To Run:
1. Pip install `Django`
2. In the terminal, cd into the mail directory.
3. Run `python3 manage.py makemigrations mail` to make migrations for the mail app.
4. Run `python3 manage.py migrate` to apply migrations to the database.
5. Run `python3 manage.py runserver` to start the Django web server and visit the website in the browser.

----

### Inbox
The populated inbox displays all emails in the user's inbox: `read` emails are displayed with a dark gray background and `unread` emails are displayed with a white background and bold text.

Additionally there is a `read/unread` button in the left of the div to switch the boolean values.

<img width="1198" alt="Screen Shot 2023-02-06 at 4 05 57 PM" src="https://user-images.githubusercontent.com/105305546/217088887-47c5265f-aba1-42aa-ae53-70042da2a672.png">

### Compose
Users can `Compose` a new email; their specific email address already being populated. If the email is in the database, `Sent` will appear at the top and fade, if the email does not exist, the user is prompted: "the user '[insert@email]' does not exist".

<img width="1194" alt="Screen Shot 2023-02-06 at 4 06 12 PM" src="https://user-images.githubusercontent.com/105305546/217089017-2ee73350-d0cb-4e20-860d-fc3a81677eb3.png">

### Reply
Users can `Reply` to an email by clicking the reply button; the subject `Re:` will populate along with the `body` of the previous email bring replied to.

<img width="1194" alt="Screen Shot 2023-02-06 at 4 09 28 PM" src="https://user-images.githubusercontent.com/105305546/217089159-467aa082-d1c4-4e17-be15-9ae73b2dce62.png">

### Archive
Users can `Archive` and unarchive emails by clicking the `Archive` button.

<img width="1194" alt="Screen Shot 2023-02-06 at 4 07 27 PM" src="https://user-images.githubusercontent.com/105305546/217090075-9b049fc9-9263-4fa5-a27c-8bac86e285f0.png">

