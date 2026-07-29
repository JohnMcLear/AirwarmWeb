/* ==========================================================================
   AIRWARM — assessment.js
   Runs the Home Energy Assessment on /home-energy-assessment/.

   TWO THINGS TO UNDERSTAND BEFORE EDITING THIS FILE
   -------------------------------------------------
   1. NOTHING LEAVES THE BROWSER. This script does not send, save, upload or
      store any answer anywhere. There is no form submission, no network
      request, no cookie and no local storage. Everything happens on the
      visitor's own device and is gone when they close the tab. That is
      deliberate: Airwarm has no CRM, no privacy policy and no registered
      data controller yet, so the site must not collect personal data. See
      "WIRE-UP POINT" near the bottom of this file for the single place to
      change when that is resolved.

   2. THE SCORING BELOW IS NOT APPROVED. The Airwarm pack specifies the three
      outcomes and their wording, but it does not say which answers lead to
      which outcome. Rather than hide an invented rule inside the code, every
      threshold is a named value in the one config object below, and every
      one of them is listed as a question in TRIAGE_RULES_FOR_REVIEW.md in the
      root of this repository.
   ========================================================================== */

/* ==========================================================================
   UNAPPROVED PLACEHOLDER LOGIC — requires Thomas Robinson's sign-off before
   this form goes live.
   ==========================================================================
   Every number and list in AIRWARM_TRIAGE_CONFIG below was chosen by the
   website builder as a starting point for discussion. None of it comes from
   the Airwarm documentation, and none of it has been reviewed by anyone
   technically qualified.

   Each entry is written out in plain English as a question in
   TRIAGE_RULES_FOR_REVIEW.md. Answer those questions, change the numbers
   here to match, and delete this comment block only when Thomas Robinson has
   confirmed the logic is correct.

   Until then the page tells the visitor, in the outcome text, that the result
   is indicative and that a person will make the real judgement.
   ========================================================================== */
var AIRWARM_TRIAGE_CONFIG = {

  /* ---- Step 1: how many points each answer is worth -------------------
     Higher points mean the answer points towards a heat pump working well.
     Negative points mean it points away. Zero means neutral, and is also
     used for every "Not sure" answer so that honesty is never penalised. */
  answerPoints: {

    /* Stage 1 — property */
    propertyType: {
      detached: 2,
      semiDetached: 2,
      endTerrace: 1,
      midTerrace: 1,
      backToBack: 0,
      bungalow: 2,
      flat: 0
    },
    propertyAge: {
      pre1919: 0,
      interwar1919to1944: 1,
      postwar1945to1975: 1,
      modern1976to2002: 2,
      newest2003onwards: 3,
      notSure: 0
    },
    currentHeating: {
      mainsGasBoiler: 1,
      oilBoiler: 2,
      lpgBoiler: 2,
      electricStorageHeaters: 2,
      directElectric: 2,
      solidFuel: 1,
      existingHeatPump: 1,
      noHeating: 1
    },

    /* Stage 2 — condition */
    insulationConfidence: {
      goodThroughout: 3,
      partial: 1,
      limited: -1,
      notSure: 0
    },
    windows: {
      doubleOrTripleThroughout: 2,
      mixed: 1,
      mostlySingle: -1,
      notSure: 0
    },
    radiators: {
      modernAndGenerous: 2,
      standard: 1,
      smallOrOld: 0,
      noneOrUnderfloor: 1,
      notSure: 0
    },
    outdoorSpace: {
      yesClearSpace: 3,
      possiblyTight: 1,
      noObviousLocation: 0,   /* handled as a constraint below, not by points */
      notSure: 0
    },
    hotWaterSpace: {
      existingCylinder: 3,
      spaceAvailable: 2,
      noSpaceIdentified: 0,   /* handled as a constraint below, not by points */
      notSure: 0
    },

    /* Stage 3 — plans */
    renovationPlans: {
      majorRenovation: 2,
      someWork: 1,
      noWorkPlanned: 0
    },
    timescale: {
      withinSixMonths: 1,
      sixToTwelveMonths: 1,
      overTwelveMonths: 0,
      justResearching: 0
    },
    emitterWillingness: {
      yesIfNeeded: 3,
      maybeWithExplanation: 1,
      notWilling: 0          /* handled as a constraint below, not by points */
    }
  },

  /* ---- Step 2: the two score thresholds -------------------------------
     A total at or above likelySuitableMinimumScore gives "Likely suitable".
     A total at or above potentiallySuitableMinimumScore gives "Potentially
     suitable". Anything below that gives "Not currently suitable".
     For reference, the maximum achievable total is about 26. */
  outcomeThresholds: {
    likelySuitableMinimumScore: 17,
    potentiallySuitableMinimumScore: 10
  },

  /* ---- Step 3: answers that stop a "Likely suitable" outcome ----------
     These are the practical obstacles listed in the Airwarm operating
     manual as common reasons a property is not currently a good candidate.
     Each one caps the result at "Potentially suitable" or lower, whatever
     the score, and each one produces a named explanation for the visitor so
     they always know WHY. Nothing here produces a blunt rejection. */
  constraintsThatCapTheOutcome: [
    {
      id: "noOutdoorLocation",
      field: "outdoorSpace",
      value: "noObviousLocation",
      capAt: "notCurrently",
      explanation: "There is no obvious outdoor position for the unit. This is " +
        "usually the first thing to solve, and it is often solvable once " +
        "someone has looked at the property properly."
    },
    {
      id: "noHotWaterSpace",
      field: "hotWaterSpace",
      value: "noSpaceIdentified",
      capAt: "potentially",
      explanation: "No location for a hot-water cylinder has been identified " +
        "yet. A cylinder is needed, so finding a sensible position is one of " +
        "the main practical questions for your home."
    },
    {
      id: "emittersNotNegotiable",
      field: "emitterWillingness",
      value: "notWilling",
      capAt: "notCurrently",
      explanation: "Keeping the existing radiators exactly as they are is a " +
        "real constraint, because a heat pump runs at a lower temperature " +
        "than a boiler and some rooms usually need a larger emitter to stay " +
        "comfortable."
    },
    {
      id: "poorFabricNoPlan",
      field: "insulationConfidence",
      value: "limited",
      requiresAlso: { field: "renovationPlans", value: "noWorkPlanned" },
      capAt: "potentially",
      explanation: "Limited insulation with no improvement work planned means " +
        "the home would lose heat faster than the system could comfortably " +
        "replace it. Fabric improvements first usually make a much bigger " +
        "difference than the choice of heat pump."
    },
    {
      id: "restrictedProperty",
      field: "propertyRestrictions",
      value: "yes",
      capAt: "potentially",
      explanation: "Listed-building, conservation-area or leasehold " +
        "restrictions do not rule a heat pump out, but they change what is " +
        "permitted and where the unit can go, so they need checking early."
    }
  ],

  /* ---- Step 4: how far outside West Yorkshire we still respond --------
     Only the outward part of the postcode is asked for, and it is never
     sent anywhere. These are the outward-code prefixes Airwarm is starting
     with. An unrecognised prefix does NOT change the outcome; it only adds a
     note about service area. */
  serviceAreaOutwardPrefixes: ["BD", "LS", "HD", "HX", "WF"],

  /* ---- Step 5: wording of the outcome labels --------------------------
     These three labels are fixed by the Airwarm pack. Do not reword them. */
  outcomeLabels: {
    likely: "Likely suitable",
    potentially: "Potentially suitable",
    notCurrently: "Not currently suitable"
  }
};
/* ===================== END OF UNAPPROVED PLACEHOLDER LOGIC ============== */


/* ==========================================================================
   Everything below this line is plumbing: showing one stage at a time,
   checking that questions have been answered, adding up the points and
   revealing the result. It contains no policy decisions.
   ========================================================================== */
(function () {
  "use strict";

  var form = document.getElementById("aw-assessment");
  if (!form) { return; }

  var stages = Array.prototype.slice.call(form.querySelectorAll(".aw-stage"));
  var totalStages = stages.length;
  var current = 0;

  var progressFill = document.getElementById("aw-progress-fill");
  var progressLabel = document.getElementById("aw-progress-label");
  var errorBox = document.getElementById("aw-form-error");
  var resultBox = document.getElementById("aw-result");

  /* The id of the validation paragraph, used to point an unanswered field's
     aria-describedby at the message about it. */
  var ERROR_ID = "aw-form-error";

  /* ---- Marking a field as unanswered, for assistive technology ---------
     The visible message at the top of the form names the questions. These two
     helpers make the same information reachable from the field itself, which
     is what a screen-reader user gets when they tab back into it. Nothing here
     stores or sends anything. */
  function markInvalid(fields) {
    Array.prototype.forEach.call(fields, function (field) {
      field.setAttribute("aria-invalid", "true");
      var ids = (field.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
      if (ids.indexOf(ERROR_ID) === -1) { ids.push(ERROR_ID); }
      field.setAttribute("aria-describedby", ids.join(" "));
    });
  }

  function clearInvalid(root) {
    Array.prototype.forEach.call(root.querySelectorAll('[aria-invalid="true"]'), function (field) {
      field.removeAttribute("aria-invalid");
      var ids = (field.getAttribute("aria-describedby") || "").split(/\s+/).filter(function (id) {
        return id && id !== ERROR_ID;
      });
      if (ids.length) {
        field.setAttribute("aria-describedby", ids.join(" "));
      } else {
        field.removeAttribute("aria-describedby");
      }
    });
  }

  /* ---- Showing one stage at a time ---------------------------------- */
  function showStage(index) {
    stages.forEach(function (stage, i) {
      stage.classList.toggle("is-active", i === index);
    });
    current = index;
    updateProgress();
    errorBox.textContent = "";
    clearInvalid(form);

    /* Move focus to the new stage heading so keyboard and screen-reader
       users are not left behind at the bottom of the page. */
    var heading = stages[index].querySelector("h2, h3");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus();
    }
  }

  function updateProgress() {
    var pct = Math.round(((current + 1) / totalStages) * 100);
    progressFill.style.width = pct + "%";
    progressLabel.textContent = "Stage " + (current + 1) + " of " + totalStages;
  }

  /* ---- Checking the current stage is complete ------------------------
     Uses the browser's own required/validity rules so the markup stays the
     single source of truth. */
  function stageIsComplete(stage) {
    var missing = [];
    var groupsSeen = {};

    clearInvalid(stage);

    Array.prototype.forEach.call(stage.querySelectorAll("[required]"), function (field) {
      if (field.type === "radio") {
        if (groupsSeen[field.name]) { return; }
        groupsSeen[field.name] = true;
        var checked = stage.querySelector('input[name="' + field.name + '"]:checked');
        if (!checked) {
          missing.push(labelFor(field));
          markInvalid(stage.querySelectorAll('input[name="' + field.name + '"]'));
        }
      } else if (!field.value) {
        missing.push(labelFor(field));
        markInvalid([field]);
      }
    });

    return missing;
  }

  /* The name a validation message uses for a field. The field's own <label>
     comes first, so that a question inside a stage-level fieldset is named by
     its question rather than by the stage. Radio groups have no label[for], so
     they fall through to their own fieldset's <legend>, which is what names
     them. */
  function labelFor(field) {
    var lbl = field.id ? document.querySelector('label[for="' + field.id + '"]') : null;
    if (lbl) { return lbl.textContent.trim(); }
    var fs = field.closest("fieldset");
    if (fs && fs.querySelector("legend")) {
      return fs.querySelector("legend").textContent.trim();
    }
    return "a question above";
  }

  /* ---- Reading the answers ------------------------------------------ */
  function readAnswers() {
    var data = {};
    Array.prototype.forEach.call(form.elements, function (field) {
      if (!field.name) { return; }
      if (field.type === "radio") {
        if (field.checked) { data[field.name] = field.value; }
      } else if (field.type === "checkbox") {
        data[field.name] = field.checked ? field.value : "";
      } else {
        data[field.name] = field.value;
      }
    });
    return data;
  }

  /* ---- Applying the placeholder logic -------------------------------- */
  function assess(answers) {
    var cfg = AIRWARM_TRIAGE_CONFIG;
    var score = 0;

    Object.keys(cfg.answerPoints).forEach(function (field) {
      var given = answers[field];
      var table = cfg.answerPoints[field];
      if (given && Object.prototype.hasOwnProperty.call(table, given)) {
        score += table[given];
      }
    });

    /* Rank the three outcomes so a cap can only ever move the result down. */
    var order = ["notCurrently", "potentially", "likely"];
    var outcome = "notCurrently";
    if (score >= cfg.outcomeThresholds.likelySuitableMinimumScore) {
      outcome = "likely";
    } else if (score >= cfg.outcomeThresholds.potentiallySuitableMinimumScore) {
      outcome = "potentially";
    }

    var reasons = [];
    cfg.constraintsThatCapTheOutcome.forEach(function (rule) {
      if (answers[rule.field] !== rule.value) { return; }
      if (rule.requiresAlso && answers[rule.requiresAlso.field] !== rule.requiresAlso.value) {
        return;
      }
      reasons.push(rule.explanation);
      if (order.indexOf(rule.capAt) < order.indexOf(outcome)) {
        outcome = rule.capAt;
      }
    });

    /* Service-area note only. This never changes the outcome. */
    var outward = (answers.postcodeArea || "").trim().toUpperCase();
    var prefix = outward.replace(/[^A-Z]/g, "").slice(0, 2);
    var inServiceArea = cfg.serviceAreaOutwardPrefixes.indexOf(prefix) !== -1;

    /* How many questions were answered "not sure". This does NOT affect the
       outcome. It is only used to explain the result honestly: someone who
       does not know much about their own house should be told that the answer
       reflects missing information rather than a fault with their property. */
    var notSureCount = 0;
    Object.keys(answers).forEach(function (field) {
      if (answers[field] === "notSure") { notSureCount += 1; }
    });

    return {
      outcome: outcome,
      score: score,
      reasons: reasons,
      notSureCount: notSureCount,
      inServiceArea: inServiceArea || outward === ""
    };
  }

  /* ---- The outcome copy ---------------------------------------------
     This wording comes from website/06_Home_Energy_Assessment/Result_Copy.md
     and is approved. The "not currently suitable" version deliberately is
     not a rejection screen: it explains the constraint and gives a route
     forward. Do not turn it into one. */
  var OUTCOME_COPY = {
    likely: {
      className: "aw-outcome--likely",
      heading: "Your home shows several positive indicators",
      body: "Your answers show several positive indicators. A short review " +
        "call is worthwhile so Airwarm can confirm the main details and " +
        "decide whether a full survey is the right next step.",
      next: "Send us an e-mail and mention that you have completed the " +
        "assessment. We will arrange a short call to go through the details."
    },
    potentially: {
      className: "aw-outcome--potentially",
      heading: "Your home may well be suitable, with a few things to check",
      body: "Your property may be suitable, but one or two details need " +
        "clarification. This is common. Airwarm will explain what matters " +
        "and what may need improving before a survey.",
      next: "Send us an e-mail describing your property. We will tell you " +
        "which details would need checking and what order to tackle them in."
    },
    notCurrently: {
      className: "aw-outcome--not-currently",
      heading: "A heat pump may not be the best next step for your home today",
      body: "A heat pump may not be the best next step today based on the " +
        "information provided. This is not necessarily a permanent " +
        "rejection. Airwarm will explain the main constraints and suggest " +
        "practical improvements or alternatives.",
      next: "This is worth a conversation rather than a dead end. E-mail us " +
        "with a short description of your property and we will tell you " +
        "honestly what would need to change, and whether it is worth doing."
    }
  };

  function renderResult(result) {
    var copy = OUTCOME_COPY[result.outcome];
    var label = AIRWARM_TRIAGE_CONFIG.outcomeLabels[result.outcome];

    var html = '<div class="aw-outcome ' + copy.className + '">';
    html += '<span class="aw-outcome__label">' + label + "</span>";
    html += "<h3>" + copy.heading + "</h3>";
    html += "<p>" + copy.body + "</p>";

    /* A result must never appear without a reason attached to it. If no
       specific obstacle was identified, say that plainly rather than leaving
       the visitor with a bare label. */
    if (result.reasons.length) {
      html += "<h4>What is driving that</h4><ul class=\"aw-ticks\">";
      result.reasons.forEach(function (reason) {
        html += "<li>" + reason + "</li>";
      });
      html += "</ul>";
    } else if (result.outcome !== "likely") {
      html += "<h4>What is driving that</h4>";
      if (result.notSureCount >= 3) {
        html += "<p>Nothing in your answers stands out as a specific " +
          "obstacle. What is holding the result back is missing information " +
          "&mdash; you answered &ldquo;not sure&rdquo; to several questions, " +
          "which is completely normal and not a mark against your home. Most " +
          "people do not know how their walls were built. A short " +
          "conversation would fill those gaps in quickly, and the answer " +
          "could easily improve.</p>";
      } else {
        html += "<p>There is no single obstacle here. The result reflects the " +
          "overall picture rather than one particular problem, which usually " +
          "means a few things would each need a small improvement rather than " +
          "one thing needing a big one. That is worth talking through, " +
          "because it is often the most fixable situation of the three.</p>";
      }
    }

    html += "<h4>A practical next step</h4><p>" + copy.next + "</p>";

    if (!result.inServiceArea) {
      html += "<p class=\"aw-small\">Your postcode area looks as though it " +
        "may be outside the Bradford, Leeds and Shipley area Airwarm is " +
        "starting with. Do still get in touch &mdash; we will tell you " +
        "straight away whether we can help or suggest looking elsewhere.</p>";
    }

    /* ---- WIRE-UP POINT ------------------------------------------------
       This is the ONLY place where contact details should ever be collected
       or sent. Right now there is intentionally no form here: Airwarm has no
       CRM, no privacy policy and no registered data controller, so the site
       must not gather personal data. Instead the visitor is invited to send
       an e-mail, which they control.

       When those decisions are made, replace the e-mail invitation below
       with a real form and a single fetch() to the chosen endpoint, and:
         - publish the privacy policy at /privacy/ first;
         - name the data controller on it;
         - add an unticked, explicit consent checkbox with its own <label>;
         - state what happens to the answers and how long they are kept;
         - add spam protection that does not rely on a third-party tracker.
       Nothing else in this file needs to change.
       ------------------------------------------------------------------ */
    html += '<div class="aw-btn-row">';
    html += '<a class="aw-btn aw-btn--primary" href="mailto:hello@airwarm.co.uk' +
      '?subject=Home%20Energy%20Assessment%20enquiry">E-mail hello@airwarm.co.uk</a>';
    /* The telephone is offered beside the e-mail because someone who has just
       read an unexpected result often wants to talk to a person about it.
       Both halves of the number must match the footer: the tel: href is the
       full international form, the visible text keeps the UK grouping. */
    html += '<a class="aw-btn aw-btn--secondary" href="tel:+441274947197">' +
      "Call 01274 947 197</a>";
    html += "</div>";

    html += '<p class="aw-small" style="margin-top:24px">This result is an ' +
      "indicative first step produced from your answers. It is not a " +
      "technical heat-loss survey and it is not a final decision &mdash; a " +
      "person at Airwarm makes that judgement, and will explain the " +
      "reasoning either way.</p>";

    html += '<p class="aw-small">Your answers have not been sent anywhere. ' +
      "Nothing you typed has left this device or been stored. Closing this " +
      "page discards it.</p>";

    html += "</div>";

    resultBox.innerHTML = html;
    resultBox.classList.remove("aw-hidden");
  }

  /* ---- Buttons ------------------------------------------------------- */
  form.addEventListener("click", function (event) {
    var next = event.target.closest("[data-aw-next]");
    var back = event.target.closest("[data-aw-back]");

    if (next) {
      event.preventDefault();
      var missing = stageIsComplete(stages[current]);
      if (missing.length) {
        errorBox.textContent = missing.length === 1
          ? "Please answer: " + missing[0]
          : "Please answer these questions before continuing: " + missing.join("; ");
        errorBox.focus();
        return;
      }
      if (current < totalStages - 1) {
        /* The final stage shows the result, so work it out on the way in. */
        if (current === totalStages - 2) {
          renderResult(assess(readAnswers()));
        }
        showStage(current + 1);
      }
    }

    if (back) {
      event.preventDefault();
      if (current > 0) { showStage(current - 1); }
    }
  });

  /* Nothing is ever submitted. If a browser or a stray Enter key tries,
     stop it here. */
  form.addEventListener("submit", function (event) {
    event.preventDefault();
  });

  /* Start on stage one with the progress indicator in step. */
  showStage(0);
}());
