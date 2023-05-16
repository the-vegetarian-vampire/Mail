const unReadIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" fill="currentColor" class="bi bi-envelope-open-fill" viewBox="0 0 16 16">
<path d="M8.941.435a2 2 0 0 0-1.882 0l-6 3.2A2 2 0 0 0 0 5.4v.314l6.709 3.932L8 8.928l1.291.718L16 5.714V5.4a2 2 0 0 0-1.059-1.765l-6-3.2ZM16 6.873l-5.693 3.337L16 13.372v-6.5Zm-.059 7.611L8 10.072.059 14.484A2 2 0 0 0 2 16h12a2 2 0 0 0 1.941-1.516ZM0 13.373l5.693-3.163L0 6.873v6.5Z"/>
</svg>
<!--<span class="visually-hidden">Unread</span>-->`;
const readIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" fill="currentColor" class="bi bi-envelope" viewBox="0 0 16 16">
<path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
</svg>
<!--<span class="visually-hidden">Read</span>-->`;

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
  if (focus) {
    $("#compose-body").focus();
    $("#compose-body").get(0).setSelectionRange(0, 0);
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
          
          div_element.className = 'email' 
          div_element.innerHTML = ` &nbsp &nbsp;
          <span style="width: 350px; display: inline-block">${email.sender}</span>
          <span style="">${email.subject}</span> &nbsp &nbsp
          <span style="float: right; margin-right: 4px">${email.timestamp}</span>`
          
          // /*
          // Add read/unread icons
          const read_icons = document.createElement('button');
          read_icons.className = "btn btn-outline-dark btn-xs float-left";
          read_icons.innerHTML = !email.read ? readIcon:unReadIcon;
          div_element.appendChild(read_icons);
          read_icons.addEventListener('click', () => email_read(email.id, !email.read) );
          //*/
         
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
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="20" fill="currentColor" class="bi bi-reply" viewBox="0 0 16 16" style="margin-bottom: 5px;">
    <path d="M6.598 5.013a.144.144 0 0 1 .202.134V6.3a.5.5 0 0 0 .5.5c.667 0 2.013.005 3.3.822.984.624 1.99 1.76 2.595 3.876-1.02-.983-2.185-1.516-3.205-1.799a8.74 8.74 0 0 0-1.921-.306 7.404 7.404 0 0 0-.798.008h-.013l-.005.001h-.001L7.3 9.9l-.05-.498a.5.5 0 0 0-.45.498v1.153c0 .108-.11.176-.202.134L2.614 8.254a.503.503 0 0 0-.042-.028.147.147 0 0 1 0-.252.499.499 0 0 0 .042-.028l3.984-2.933zM7.8 10.386c.068 0 .143.003.223.006.434.02 1.034.086 1.7.271 1.326.368 2.896 1.202 3.94 3.08a.5.5 0 0 0 .933-.305c-.464-3.71-1.886-5.662-3.46-6.66-1.245-.79-2.527-.942-3.336-.971v-.66a1.144 1.144 0 0 0-1.767-.96l-3.994 2.94a1.147 1.147 0 0 0 0 1.946l3.994 2.94a1.144 1.144 0 0 0 1.767-.96v-.667z"/>
    </svg> Reply`;
    replyButton.className = 'btn btn-outline-primary btn-sm mr-2';
    buttons_div.appendChild(replyButton);

    // Reply button functionality
    replyButton.addEventListener('click', function(event) {
      let subject = email.subject
      if (!email.subject.startsWith("Re: ")) {
        subject = `Re: ${subject}`
      }
      let body = `\n\n\n -------------------------------------------- \n>>On ${email.timestamp} <${email.sender}> wrote:\n${email.body}\n`
      let recipient = email.sender;
       // Takes user to compose form
      compose_email(event, recipient, subject, body)
  });   

    // Archive button
    const archive_Button = document.createElement('button');
    var buttonText = (email.archived == false) ? "Archive" : "Unarchive";
    archive_Button.type = 'button';
    archive_Button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="25" fill="currentColor" class="bi bi-archive-fill" viewBox="0 0 16 16">
    <path d="M12.643 15C13.979 15 15 13.845 15 12.5V5H1v7.5C1 13.845 2.021 15 3.357 15h9.286zM5.5 7h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1zM.8 1a.8.8 0 0 0-.8.8V3a.8.8 0 0 0 .8.8h14.4A.8.8 0 0 0 16 3V1.8a.8.8 0 0 0-.8-.8H.8z"/>
  </svg> &nbsp;` + buttonText;
    archive_Button.className = 'btn btn-outline-warning btn-sm mr-2'
    buttons_div.appendChild(archive_Button);
    
    // Archive or unarchive button functionality
    archive_Button.onclick = () => {
      archiveEmail(email);
    } 
}
}
async function archiveEmail(email) {
  // Waits for status of "archived" of email to be updated
  await fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: !email.archived
    })
  })
  // Returns inbox
  return load_mailbox('inbox');
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
  

  // Adding this function below would load 'sent emails' after submitting.
  // load_mailbox('sent');

}

function email_read(id, status){
  fetch('/emails/' + id, {
    method: 'PUT',
    body: JSON.stringify({ read : status })
  });
  // Reloads if read -> unread
  if (!status){ 
    load_mailbox('inbox');
    window.location.reload();
  }
}