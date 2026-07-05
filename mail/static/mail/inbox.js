document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // FORM/ LINK LISTENERS
  document.querySelector("#compose-form").addEventListener('submit', compose_submit);
  document.querySelector("#emails-view").addEventListener('click', event => {
    // Look upwards DOM for <a> with '.email-item' class
    const email_item = event.target.closest(".email-item")

    // if exists, prevent actual redirect and pass the element
    if (email_item) {
      event.preventDefault();
      load_email(email_item);
    }
  });

  // OTHER BUTTONS
  document.querySelector("#compose-reset").addEventListener('click', compose_form_reset);
});


/* ===== VIEW FUNCTIONS ===== */
function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-details-view').style.display = 'none';

  // Show Page title
  document.querySelector('#email-box-title').innerHTML = `<h2>New Email</h2>`;
  
  // Clear out composition fields
  compose_form_reset();
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-details-view').style.display = 'none';

  // Show Page title as mailbox name
  document.querySelector('#email-box-title').innerHTML = `<h2>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h2>`;

  // Loads the actual emails
  render_mails(mailbox);
}

function load_email(email_item) {
  // Show a single email details and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-details-view').style.display = 'block';

  // Show Page title
  document.querySelector('#email-box-title').innerHTML = `<h2>Viewing an Email</h2>`;

  // Loads the actual email
  render_single_email(email_item);
}


/* ===== UTILITY FUNCTIONS ===== */
function compose_form_reset() {
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


/* ===== AJAX FUNCTIONS ===== */

/* Logic for composing email */
async function compose_submit(event) {
  // Prevent actual form submission
  event.preventDefault();

  // POST the email to the server
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
  }
  catch (error) {
    console.log(`Error: ${error.message}`);
    return;
  }
  // Hide Compose View and Show Inbox
  load_mailbox('inbox');
}

/* Logic for rendering emails */
async function render_mails(mailbox) {
  let emails = [];
  // GET the corresponding emails from server
  try {
    const response = await fetch(`/emails/${mailbox}`);
    emails = await response.json();
  }
  catch (error) {
    console.log(`Error: ${error.message}`);
    return;
  }

  // Get the email container and empty it (else, rendered emails will become duplicate)
  emails_container = document.getElementById("emails-view");
  emails_container.innerHTML = "";

  // Insert each email to the container
  emails.forEach(email => {
    // Create a Parent Element <a> with (row)
    email_element = document.createElement('a');
    email_element.dataset.emailId = email.id;
    email_element.href = `/emails/${email.id}`;   // Just for flavour, will not actually redirect

    // Attach event listener to each email_element generated
    // email_element.addEventListener('click', render_single_email)

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

    // Add Child Elements (col)
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

/* Logic for viewing a specific mail */
async function render_single_email(email_item) {
  let email = {};
  // GET the clicked email-element's details from server
  try {
    const response = await fetch(`emails/${email_item.dataset.emailId}`);
    email = await response.json();
  }
  catch (error) {
    console.log(`Error: ${error.message}`);
    return;
  }

  // Output to console
  console.log(email);

  // Add the values to HTML
  document.querySelector("#email-sender").innerText = email.sender;
  document.querySelector("#email-recipients").innerText = email.recipients.join(", ");
  document.querySelector("#email-subject").innerText = email.subject;
  document.querySelector("#email-text").innerText = email.body;
}
