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
      emails.forEach(email => {
          const div_element = document.createElement("div");
          div_element.innerHTML = `


              <div class="far fa-square" style="color: grey; margin-right: 20px;"></div>
              

              <span style="width: 275px; display: inline-block">${email.sender}</span>
              <span>${email.subject}</span> 
              <span style="float: right; font">${email.timestamp}</span>`
          div_element.className = "mailbox-email"

          if (email.read) {
              div_element.style.fontWeight = 'normal';
          }
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
                        .then(response => {console.log(`email is read ${response.status}`)})
                }
                // load details onto page
                loadEmail(email, mailbox)
            });
          })
          // If read, change background color
          div_element.style.backgroundColor = "white";
          if (email.read) {
            div_element.style.backgroundColor = "rgba(255,255,255,85%)";
          }
          document.querySelector("#emails-view").append(div_element)
      })
  });
}

function loadEmail() {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';


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