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
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Loads the actual emails
  mailbox_view(mailbox);
}

/* ===== AJAX Functions ===== */

// Logic for composing email
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

// Logic for rendering emails
async function mailbox_view(mailbox) {
  try {
    const response = await fetch(`/emails/${mailbox}`);
    const emails = await response.json();

    emails_container = document.getElementById("emails-view");

    // Insert each email to the Element
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
        email.read ? "bg-body-secondary" : "bg-light",
      ];
      email_element.classList.add(...classes);

      // Add Child Elements (Col)
      email_element.innerHTML += `
        <div class="col-auto border-end">
            <img src="/static/mail/email.svg" style="width: 40px; height: 40px;">
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
  catch (error) {
    console.log(`Error: ${error.message}`);
  }
}