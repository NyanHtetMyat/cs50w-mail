document.addEventListener('DOMContentLoaded', function() {

  // By default, load the inbox
  load_mailbox('inbox');

  /*=== BUTTONS FOR TOGGLING BETWEEN VIEWS ===*/
  document.querySelector('#inbox').addEventListener('click', () => {
    add_to_history('mailbox', 'inbox');
    load_mailbox('inbox');
  });
  document.querySelector('#sent').addEventListener('click', () => {
    add_to_history('mailbox', 'sent');
    load_mailbox('sent');
  });
  document.querySelector('#archive').addEventListener('click', () => {
    add_to_history('mailbox', 'archive');
    load_mailbox('archive');
  });
  document.querySelector('#compose').addEventListener('click', () => {
    add_to_history('compose');
    compose_email();
  });

  /*=== FORM/ LINK LISTENERS ===*/
  document.querySelector("#compose-form").addEventListener('submit', compose_submit);
  document.querySelector("#email-archive-unarchive").addEventListener('click', toggle_archive);
  document.querySelector("#email-reply").addEventListener('click', email_reply);

  // Attach listener to the parent container (cuz the email list has dozens of emails)
  document.querySelector("#emails-view").addEventListener('click', event => {
    const email_item = event.target.closest(".email-item")    // Look upwards DOM for <a> with '.email-item' class
    if (email_item) {
      event.preventDefault();

      const email_id = email_item.dataset.emailId;

      set_active_nav_btn();
      add_to_history('email', email_id);
      load_email(email_item.dataset.emailId);
    }
  });

  /*=== OTHER BUTTONS ===*/
  document.querySelector("#compose-reset").addEventListener('click', compose_form_reset);

  /*=== BROWSER BACKBUTTON LISTENER ===*/
  window.addEventListener('popstate', event => {
    if (event.state.view === 'mailbox') {
      load_mailbox(event.state.mailbox);
    }
    else if (event.state.view === 'compose') {
      compose_email();
    }
    else if (event.state.view === 'email') {
      load_email(event.state.email_id);
    }
  });
});


/* ===== VIEW FUNCTIONS ===== */
function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-details-view').style.display = 'none';

  // Show Page title
  document.querySelector('#email-box-title').innerHTML = `<h2>New Email</h2>`;

  // Set Active Highlight
  set_active_nav_btn(document.querySelector("#compose"));
  
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

  // Set Active Highlight
  set_active_nav_btn(document.querySelector(`#${mailbox}`));

  // Store mailbox name in HTML
  document.querySelector('#emails-view').dataset.mailboxName = mailbox;

  // Loads the actual emails
  render_mails(mailbox);
}

function load_email(email_id) {
  // Show a single email details and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-details-view').style.display = 'block';

  // Show Page title
  document.querySelector('#email-box-title').innerHTML = `<h2>Viewing Email</h2>`;

  // Loads the actual email
  render_single_email(email_id);
}


/* ===== UTILITY FUNCTIONS ===== */
function compose_form_reset() {
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-text').value = '';
}

function add_to_history(view, param = null) {
  if (view === 'mailbox') {
    history.pushState({ view: view, mailbox: param }, "", `/mailbox/${param}`);
  }
  else if (view === 'compose') {
    history.pushState({ view: view }, "", `/${view}`);
  }
  else if (view === 'email') {
    history.pushState({ view: view, email_id: param }, "", `/emails/${param}`);
  }
}

async function get_email_details(email_id) {
  const response = await fetch(`/emails/${email_id}`);
  const data = await response.json();

  // For errors of 404 or 500
  if (!response.ok)
    throw new Error(data.error || "Something went wrong.");

  return data;
}

function set_active_nav_btn(nav_btn = null) {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.remove("active");
  })

  if (nav_btn) {
    nav_btn.classList.add("active");
  }
}


/* ===== CORE LOGICS ===== */

/*=== Logic for composing email ===*/
async function compose_submit(event) {
  // Prevent actual form submission
  event.preventDefault();

  // POST the email to the server
  try {
    const response = await fetch("/emails", {
      method: "POST",
      body: JSON.stringify({
        'recipients': document.getElementById('compose-recipients').value,
        'subject': document.getElementById('compose-subject').value.trim() || "(No Subject)",
        'body': document.getElementById('compose-text').value
      })
    });
    
    const data = await response.json();
    
    // For errors of 404 or 500
    if (!response.ok)
      throw new Error(data.error);

    // Show Success Message
    alert(data.message);
  }
  catch (error) {
    alert(`Error Sending Email: ${error.message}`);
    return;
  }
  // Hide Compose View and Show Inbox
  add_to_history('mailbox', 'inbox');
  load_mailbox('inbox');
}

/*=== Logic for rendering emails ===*/
async function render_mails(mailbox) {
  let emails = [];
  // GET the corresponding emails from server
  try {
    const response = await fetch(`/emails/${mailbox}`);
    emails = await response.json();
  }
  catch (error) {
    alert(`Error Loading ${mailbox}: ${error.message}`);
    return;
  }

  // Get the email container and empty it (else, rendered emails will become duplicate)
  const emails_container = document.getElementById("emails-view");
  emails_container.innerHTML = "";

  // Check for empty emails
  if (!emails.length) {
    emails_container.innerHTML = `<h4 class="text-center text-muted">Nothing to see here :(</h4>`;
    return;
  }

  // Insert each email to the container
  emails.forEach(email => {
    // Create a Parent Element <a> with (row)
    const email_element = document.createElement('a');
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

              <h4 class="col-12 text-truncate">${email.subject}</h4>

              <small class="col-12 text-muted">${email.timestamp}</small>
          </dl>
      </div>
    `
    emails_container.append(email_element);
  });
}

/*=== Logic for viewing a specific mail ===*/
async function render_single_email(email_id) {
  // GET email details from server
  let email = {};
  try {
    email = await get_email_details(email_id);
  }
  catch (error) {
    alert(`Error Fetching Email Details: ${error.message}`);
    return;
  }

  // Add EMAIL-ID to the parent card (ID will be used by toggle-archive and email-reply)
  document.querySelector('#email-details-card').dataset.emailId = email.id;

  // Add the values to HTML
  document.querySelector("#email-sender").innerText = email.sender;
  document.querySelector("#email-recipients").innerText = email.recipients.join(", ");
  document.querySelector("#email-timestamp").innerText = email.timestamp;
  document.querySelector("#email-subject").innerText = email.subject;
  document.querySelector("#email-text").innerText = email.body;

  // For showing/hiding 'Archive' button depending on mailbox (Logged in user's email is stored in Header Part of the layout)
  const currentUserEmail = document.querySelector("#user-email").dataset.userEmail;
  const button = document.querySelector("#email-archive-unarchive");
  if (email.sender === currentUserEmail) {
    button.classList.add('d-none');     // Apparently, style.display = 'none' did not work.
    button.classList.remove('d-flex');
  }
  else {
    button.classList.add('d-flex');
    button.classList.remove('d-none');
  }

  // Render 'Archive' or 'Unarchive' texts and icons
  if (email.archived) {
    button.innerHTML = `                            
      <span>Unarchive</span>
      <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M3.95526 2.25C3.97013 2.25001 3.98505 2.25001 4.00001 2.25001L20.0448 2.25C20.4776 2.24995 20.8744 2.24991 21.1972 2.29331C21.5527 2.3411 21.9284 2.45355 22.2374 2.76257C22.5465 3.07159 22.6589 3.44732 22.7067 3.8028C22.7501 4.12561 22.7501 4.52245 22.75 4.95526V5.04475C22.7501 5.47757 22.7501 5.8744 22.7067 6.19721C22.6589 6.55269 22.5465 6.92842 22.2374 7.23744C21.9437 7.53121 21.5896 7.64733 21.25 7.69914V13.0564C21.25 14.8942 21.25 16.3498 21.0969 17.489C20.9392 18.6615 20.6071 19.6104 19.8588 20.3588C19.1104 21.1071 18.1615 21.4392 16.989 21.5969C15.8498 21.75 14.3942 21.75 12.5564 21.75H11.4436C9.60583 21.75 8.1502 21.75 7.01098 21.5969C5.83856 21.4392 4.88961 21.1071 4.14125 20.3588C3.39289 19.6104 3.06077 18.6615 2.90314 17.489C2.74998 16.3498 2.74999 14.8942 2.75001 13.0564L2.75001 7.69914C2.41038 7.64733 2.05634 7.53121 1.76257 7.23744C1.45355 6.92842 1.3411 6.55269 1.29331 6.19721C1.24991 5.8744 1.24995 5.47757 1.25 5.04476C1.25001 5.02988 1.25001 5.01496 1.25001 5.00001C1.25001 4.98505 1.25001 4.97013 1.25 4.95526C1.24995 4.52244 1.24991 4.12561 1.29331 3.8028C1.3411 3.44732 1.45355 3.07159 1.76257 2.76257C2.07159 2.45355 2.44732 2.3411 2.8028 2.29331C3.12561 2.24991 3.52244 2.24995 3.95526 2.25ZM4.25001 7.75001V13C4.25001 14.9068 4.2516 16.2615 4.38977 17.2892C4.52503 18.2952 4.7787 18.8749 5.20191 19.2981C5.62512 19.7213 6.20477 19.975 7.21086 20.1102C8.19303 20.2423 9.47389 20.2496 11.25 20.25V13.9545L9.55748 15.8351C9.28038 16.1429 8.80617 16.1679 8.49828 15.8908C8.1904 15.6137 8.16544 15.1395 8.44254 14.8316L11.4425 11.4983C11.5848 11.3402 11.7874 11.25 12 11.25C12.2126 11.25 12.4152 11.3402 12.5575 11.4983L15.5575 14.8316C15.8346 15.1395 15.8096 15.6137 15.5017 15.8908C15.1938 16.1679 14.7196 16.1429 14.4425 15.8351L12.75 13.9545V20.25C14.5261 20.2496 15.807 20.2423 16.7892 20.1102C17.7952 19.975 18.3749 19.7213 18.7981 19.2981C19.2213 18.8749 19.475 18.2952 19.6102 17.2892C19.7484 16.2615 19.75 14.9068 19.75 13V7.75001H4.25001ZM2.82324 3.82324L2.82568 3.82187C2.82761 3.82086 2.83093 3.81924 2.83597 3.81717C2.85775 3.80821 2.90611 3.79291 3.00267 3.77993C3.21339 3.7516 3.5074 3.75001 4.00001 3.75001H20C20.4926 3.75001 20.7866 3.7516 20.9973 3.77993C21.0939 3.79291 21.1423 3.80821 21.164 3.81717C21.1691 3.81924 21.1724 3.82086 21.1743 3.82187L21.1768 3.82323L21.1781 3.82568C21.1792 3.82761 21.1808 3.83093 21.1828 3.83597C21.1918 3.85775 21.2071 3.90611 21.2201 4.00267C21.2484 4.21339 21.25 4.5074 21.25 5.00001C21.25 5.49261 21.2484 5.78662 21.2201 5.99734C21.2071 6.0939 21.1918 6.14226 21.1828 6.16404C21.1808 6.16909 21.1792 6.1724 21.1781 6.17434L21.1768 6.17678L21.1743 6.17815C21.1724 6.17916 21.1691 6.18077 21.164 6.18285C21.1423 6.19181 21.0939 6.2071 20.9973 6.22008C20.7866 6.24841 20.4926 6.25001 20 6.25001H4.00001C3.5074 6.25001 3.21339 6.24841 3.00267 6.22008C2.90611 6.2071 2.85775 6.19181 2.83597 6.18285C2.83093 6.18077 2.82761 6.17916 2.82568 6.17815L2.82324 6.17677L2.82187 6.17434C2.82086 6.1724 2.81924 6.16909 2.81717 6.16404C2.80821 6.14226 2.79291 6.0939 2.77993 5.99734C2.7516 5.78662 2.75001 5.49261 2.75001 5.00001C2.75001 4.5074 2.7516 4.21339 2.77993 4.00267C2.79291 3.90611 2.80821 3.85775 2.81717 3.83597C2.81924 3.83093 2.82086 3.82761 2.82187 3.82568L2.82324 3.82324ZM2.82324 6.17677C2.82284 6.17636 2.82297 6.17644 2.82324 6.17677V6.17677Z"/>
      </svg>`;
  }
  else {
      button.innerHTML = `                            
      <span>Archive</span>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.5 7V13C20.5 16.7712 20.5 18.6569 19.3284 19.8284C18.1569 21 16.2712 21 12.5 21H11.5C7.72876 21 5.84315 21 4.67157 19.8284C3.5 18.6569 3.5 16.7712 3.5 13V7" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M2 5C2 4.05719 2 3.58579 2.29289 3.29289C2.58579 3 3.05719 3 4 3H20C20.9428 3 21.4142 3 21.7071 3.29289C22 3.58579 22 4.05719 22 5C22 5.94281 22 6.41421 21.7071 6.70711C21.4142 7 20.9428 7 20 7H4C3.05719 7 2.58579 7 2.29289 6.70711C2 6.41421 2 5.94281 2 5Z" stroke="#ffffff" stroke-width="1.5"/>
        <path d="M12 7L12 16M12 16L15 12.6667M12 16L9 12.6667" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
  }

  // UPDATE 'read' status if haven't read
  if (!email.read) {
    try {
      await fetch(`/emails/${email.id}`, {
        method: "PUT",
        body: JSON.stringify({
          'read': true,
        })
      });
    }
    catch (error) {
      alert(`Error Updating Read Status: ${error.message}`);
      return;
    } 
  }
}


/*=== Logic for toggling archive button ===*/
async function toggle_archive() {
  // GET email details from server
  let email = {};
  try {
    email = await get_email_details(document.querySelector('#email-details-card').dataset.emailId);
  }
  catch (error) {
    alert(`Error Fetching Email Details: ${error.message}`);
    return;
  }

  // Toggle Logic
  try {
    await fetch(`/emails/${email.id}`, {
      method: "PUT",
      body: JSON.stringify({
        'archived': !email.archived,
      })
    });
  }
  catch (error) {
    alert(`Error Toggling Archive: ${error.message}`);
    return;
  }

  // Redirect to Inbox
  add_to_history('mailbox', 'inbox');
  load_mailbox('inbox');
}


/*=== Logic for replying email ===*/
async function email_reply() {
  // GET email details from server
  let email = {};
  try {
    email = await get_email_details(document.querySelector('#email-details-card').dataset.emailId);
  }
  catch (error) {
    alert(`Error Fetching Email Details: ${error.message}`);
    return;
  }

  // Take the user to Compose Form
  add_to_history('compose');
  compose_email();

  // Add the values to HTML 
  document.querySelector('#compose-recipients').value = email.sender;
  document.querySelector('#compose-subject').value = (email.subject.startsWith("Re: ")) ? email.subject : `Re: ${email.subject}`;
  document.querySelector('#compose-text').value = `\n\nOn ${email.timestamp} ${email.sender} wrote: \n${email.body}`;
}