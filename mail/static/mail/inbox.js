document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // AJAX Backend Logics
  document.getElementById("compose-form").addEventListener('submit', compose_view);

  // Other Buttons
  document.querySelector("#compose-reset").addEventListener('click', compose_form_reset);
});


/*===== VIEW FUNCTIONS =====*/
function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  compose_form_reset();

  // Show the mailbox name
  document.querySelector('#email-box-title').innerHTML = `<h2>New Email</h2>`;
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#email-box-title').innerHTML = `<h2>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h2>`;

  // Loads the actual emails
  mailbox_view(mailbox);
}


/*===== UTILITY FUNCTIONS =====*/
function compose_form_reset() {
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


/*===== AJAX FUNCTIONS =====*/

/* Logic for composing email */
async function compose_view(event) {
  // Prevent actual form submission
  event.preventDefault();

  try {
    const response = await fetch("/emails", {
      method: "POST",
      body: JSON.stringify({
        'recipients': document.getElementById('compose-recipients').value,
        'subject': document.getElementById('compose-subject').value,
        'body': document.getElementById('compose-body').value
      })
    });
    const data = await response.json();

    // Output Success Message to console
    console.log(data.message);

    // Hide Compose View and Show Inbox
    load_mailbox('inbox');
  }
  catch (error) {
    console.log(`Error: ${error.message}`);
  }
}

/* Logic for rendering emails */
async function mailbox_view(mailbox) {
  let emails = [];

  // Fetches the emails from backend
  try {
    const response = await fetch(`/emails/${mailbox}`);
    emails = await response.json();
  }
  catch (error) {
    console.log(`Error: ${error.message}`);
    return;
  }

  // Get the email container and empty it
  emails_container = document.getElementById("emails-view");
  emails_container.innerHTML = ""

  // Insert each email to the container
  emails.forEach(email => {
    // Create a Parent Element (Row)
    email_element = document.createElement('a');
    email_element.href = `/emails/${email.id}`;
    const classes = [
      "row",
      "flex-nowrap",
      "text-decoration-none",
      "py-3",
      "border",
      "email-item",
      email.read ? "email-read" : "email-unread",
    ];
    email_element.classList.add(...classes);  

    // Add Child Elements (Col)
    email_element.innerHTML = `
      <div class="col-auto border-end">
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-envelope" viewBox="0 0 16 16">
            <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1zm13 2.383-4.708 2.825L15 11.105zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741M1 11.105l4.708-2.897L1 5.383z"/>
          </svg>
      </div>
      
      <div class="col">
          <dl class="row mb-0">
              <dt class="col-auto fw-bold">From :</dt>
              <dd class="col">${email.sender}</dd>

              <h4 class="col-12 text-turncate">${email.subject}</h4>

              <small class="col-12 text-muted">${email.timestamp}</small>
          </dl>
      </div>
    `
    emails_container.append(email_element);
  });
}