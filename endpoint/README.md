# The enquiry endpoint

`Code.gs` receives the enquiry form at the end of the Home Energy Assessment
and e-mails it to `hello@airwarm.co.uk`. It stores nothing.

It is a **Google Apps Script web app**, running inside the Airwarm Google
Workspace account.

---

## Why this and not a form service

The privacy policy says the form

> sends us an e-mail and nothing else. There is no database, no customer
> relationship system and no third-party dashboard holding a list of enquiries.

That is only true if whatever receives the form keeps no copy. Formspree,
Basin, Tally and the rest all store every submission in their own dashboard.
That makes them a **processor** under UK GDPR: they would have to be named in
the privacy policy, covered by a data-processing agreement, and included in
any deletion request someone makes.

Running it here keeps the enquiry inside Google Workspace, which the privacy
policy **already names** as Airwarm's processor, with the written agreement
and the US transfer basis already set out. So there is no new vendor, no new
DNS, no new contract, and no change to the notice.

**The rule this protects:** do not add storage to `Code.gs`. No Sheet, no
Drive file, no logging of the payload. The moment it writes an enquiry
anywhere other than the outbound e-mail, the privacy policy stops being true
and has to be rewritten *before* that change ships.

---

## Setting it up

About ten minutes, once.

### 1. Create the script

1. Sign in to Google as **hello@airwarm.co.uk** (it must be this account — the
   e-mail is sent from whoever owns the script).
2. Go to <https://script.google.com> and click **New project**.
3. Delete the placeholder `function myFunction() {}`.
4. Paste in the entire contents of `Code.gs` from this folder.
5. Rename the project (top left) to **Airwarm enquiry endpoint**.
6. Save.

### 2. Deploy it as a web app

1. **Deploy → New deployment**.
2. Click the gear next to "Select type" and choose **Web app**.
3. Set:
   - **Description:** `Airwarm enquiry form`
   - **Execute as:** `Me (hello@airwarm.co.uk)`
   - **Who has access:** `Anyone`
4. **Deploy**.
5. Google asks you to authorise it. It will warn that the app is not verified —
   that is expected for your own script. Click **Advanced**, then **Go to
   Airwarm enquiry endpoint (unsafe)**, then **Allow**. You are granting your
   own script permission to send mail as you.
6. Copy the **Web app URL**. It looks like:
   `https://script.google.com/macros/s/AKfycb…/exec`

> **"Who has access: Anyone" is correct and is not a security hole.** The form
> is on a public website, so the endpoint has to accept requests from people
> who are not signed in to anything. The script only ever sends one e-mail to
> a hard-coded address — there is no data to read back out of it.

### 3. Check it is alive

Paste the Web app URL straight into a browser. You should see:

```
Airwarm enquiry endpoint is running.
```

### 4. Switch the form on

In `js/assessment.js`, set the URL at the top of the file:

```js
var ENQUIRY_ENDPOINT = "https://script.google.com/macros/s/AKfycb…/exec";
```

Commit and push. Until this line has a URL in it the form does not render at
all, and the site collects nothing.

### 5. Send yourself a real one

Go to <https://airwarm.co.uk/home-energy-assessment/>, complete the four
stages, fill in the form and send it. The e-mail should arrive within a few
seconds.

**Check the reply-to works**: hit reply on that e-mail and confirm it addresses
the enquirer, not you.

---

## Changing it later

Edit the script, then **Deploy → Manage deployments → edit (pencil) → Version:
New version → Deploy**. The URL stays the same.

Creating a *new deployment* instead gives you a *new URL* and the old one keeps
running the old code — a good way to end up debugging a version you are no
longer editing.

Keep `Code.gs` in this repository in step with what is deployed. The script
editor is not version control.

---

## If it stops working

| Symptom | Likely cause |
| --- | --- |
| Form shows the "that did not send" message every time | Deployment URL wrong, or the deployment was never authorised. Open the URL in a browser and check for the health-check text. |
| Health check works, form still fails | The deployment's **Who has access** is not `Anyone`. |
| Nothing arrives but the form says it sent | Check the Gmail Sent folder for `hello@airwarm.co.uk`, then spam. |
| Worked, then stopped after an edit | You edited the script but deployed a *new* deployment instead of a new *version* of the existing one. |

Apps Script has a daily sending quota — 1,500 recipients a day on Google
Workspace. At the volumes this form will see, that is not a limit you can
reach by accident.

---

## If you outgrow it

The moment enquiries need to live somewhere other than an inbox — a pipeline
view, a status per enquiry, two people working the same list — this stops being
the right answer. At that point it becomes the small backend described in
`Assessment_Engine_Architecture_Proposal.md`, and the privacy policy needs the
rewrite that proposal sets out. The form in `assessment.js` would not have to
change: only the URL it posts to.
