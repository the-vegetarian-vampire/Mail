document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector("#compose-form").onsubmit = () => {
    const recipients = document.querySelector("#compose-recipients").value;
    const subject = document.querySelector("#compose-subject").value;
    const body = document.querySelector("#compose-body").value;
    send_email(recipients, subject, body);
    // Stop form from submitting
    return false;
  }
  // By default, load the inbox
  load_mailbox('inbox');
  
});

// Display messages from API
function display_messages(result) {
  document.querySelector("#results").innerHTML = typeof result === "string" ? result : result.message || result.error;
  // JQuery link in layout.html
  $("#message").fadeTo(1000, 100, () => {
    $("#message").fadeTo(2500, 0).slideUp(500);
  });
}

function compose_email(event, recipients="", subject="", body="") {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  document.querySelector('#compose-recipients').value = recipients;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = body;
  if (body.length > 0) {
    document.querySelector('#compose-body').focus();
  } else {
    document.querySelector('#compose-recipients').focus();
  }
}

function load_mailbox(mailbox) {
  
  $("#message").hide();

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Query API for emails in mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // if no emails in 'inbox' or 'archive' display message
    if (emails.length === 0) {
      const empty = document.createElement("div");
      empty.innerHTML = "No emails."
      document.querySelector('#emails-view').appendChild(empty);
    }
    // create new element
      emails.forEach(email => {
          const div_element = document.createElement("div");
          div_element.className = 'row border right border left border bottom border top' 
          div_element.innerHTML = `
          &nbsp;
          <span style="padding: 4px;"> <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="currentColor" class="bi bi-square" viewBox="0 0 16 16">
          <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
          </svg> </span> &nbsp; &nbsp;
          <span style="width: 240px; display: inline-block; margin-top: 5px;">${email.sender}</span>
          <span style="width: 290px; text-align: center; font; margin-top: 5px;">${email.subject}</span> 
          <span style="width: 560px; text-align: right; font; margin-top: 5px;">${email.timestamp}</span>
          `

          // display contents of clicked email
          div_element.addEventListener('click', function() {
          fetch(`/emails/${email.id}`)
              .then(response => response.json())
              .then(email => {
                // set email to read
                if (!email.read) {
                    fetch(`/emails/${email.id}`, {
                        method: 'PUT',
                        body: JSON.stringify({read: true})
                    })
                        .then(response => {console.log('email clicked and read')})
                }
                // load details onto page
                loadEmail(email, mailbox)
            });
          })
          // Change background color
          if (email.read) {
            div_element.style.backgroundColor = "rgba(235,235,235,80%)";
          } else {
            div_element.style.backgroundColor = "white"; div_element.classList.add('font-weight-bold');
          }
          document.querySelector("#emails-view").append(div_element)
      })
  });
}

function loadEmail(email, mailbox) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  document.querySelector('#email-view').innerHTML = `
  <div class="d-flex justify-content-between flex-nowrap-sm flex-wrap">
    <h5 class="text-center">${email.subject}</h5>
    <small class="mr-lg-4 ml-0 ml-sm-2 font-weight-lighter align-self-center text-muted text-right">${email.timestamp} &nbsp;&nbsp;&nbsp; <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star" viewBox="0 0 16 16">
    <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.565.565 0 0 0-.163-.505L1.71 6.745l4.052-.576a.525.525 0 0 0 .393-.288L8 2.223l1.847 3.658a.525.525 0 0 0 .393.288l4.052.575-2.906 2.77a.565.565 0 0 0-.163.506l.694 3.957-3.686-1.894a.503.503 0 0 0-.461 0z"/>
  </svg></small>
  </div>
  <div class="d-flex justify-content-between py-3 pt-md-2 border-bottom flex-wrap">
    <div>
      <strong>From:</strong> ${email.sender}<br>
      <strong>To:</strong> ${email.recipients}<br>
      <strong>Subject:</strong> ${email.subject}
    </div>
    <div class="text-nowrap mr-lg-4 ml-0 ml-sm-2" id="buttons">
    </div>
  </div>
  <div class="pt-1" style="white-space: pre-line">
    ${email.body}
  </div>`;

  let buttons_div = document.getElementById('buttons');
  if (mailbox != 'sent') {
    // Reply button
    const replyButton = document.createElement('button');
    replyButton.type = 'button';
    replyButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="25" fill="currentColor" class="bi bi-reply" viewBox="0 0 16 16" style="margin-bottom: 5px;">
    <path d="M6.598 5.013a.144.144 0 0 1 .202.134V6.3a.5.5 0 0 0 .5.5c.667 0 2.013.005 3.3.822.984.624 1.99 1.76 2.595 3.876-1.02-.983-2.185-1.516-3.205-1.799a8.74 8.74 0 0 0-1.921-.306 7.404 7.404 0 0 0-.798.008h-.013l-.005.001h-.001L7.3 9.9l-.05-.498a.5.5 0 0 0-.45.498v1.153c0 .108-.11.176-.202.134L2.614 8.254a.503.503 0 0 0-.042-.028.147.147 0 0 1 0-.252.499.499 0 0 0 .042-.028l3.984-2.933zM7.8 10.386c.068 0 .143.003.223.006.434.02 1.034.086 1.7.271 1.326.368 2.896 1.202 3.94 3.08a.5.5 0 0 0 .933-.305c-.464-3.71-1.886-5.662-3.46-6.66-1.245-.79-2.527-.942-3.336-.971v-.66a1.144 1.144 0 0 0-1.767-.96l-3.994 2.94a1.147 1.147 0 0 0 0 1.946l3.994 2.94a1.144 1.144 0 0 0 1.767-.96v-.667z"/>
    </svg> Reply`;
    replyButton.className = 'btn btn-outline-primary btn-sm mr-1';
    buttons_div.appendChild(replyButton);
    
    // Takes user to compose form
    replyButton.onclick = () => {
      compose_email(recipient, subject, body)
    }

}
}
function send_email(recipients, subject, body) {
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body,
    })
  })
  .then(response => response.json())
  .then(result => {
    // Print result
    console.log(result);
    if (!("error" in result)) 
    load_mailbox("sent");
    display_messages(result);
  })
  .catch(error => console.log(error))
}
  // loads sent emails after 'sent'
  // load_mailbox('sent');
