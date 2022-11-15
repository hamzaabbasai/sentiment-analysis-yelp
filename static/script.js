window.addEventListener("error", function (e) {
  console.log("Script error caught:", e.error);
  return true;
});

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, initializing app...");
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get("error");
  if (error) {
    showAlert(error, "danger");
  }

  const textArea = document.getElementById("text");
  const charCount = document.getElementById("char-count");
  const analyzeBtn = document.getElementById("analyze-btn");
  const form = document.getElementById("sentiment-form");

  if (textArea && charCount) {
    function updateCharCount() {
      const count = textArea.value.length;
      charCount.textContent = count;

      if (count > 4500) {
        charCount.className = "text-danger font-weight-bold";
      } else if (count > 4000) {
        charCount.className = "text-warning font-weight-bold";
      } else {
        charCount.className = "text-primary font-weight-bold";
      }
    }

    textArea.addEventListener("input", updateCharCount);
    textArea.addEventListener("paste", function () {
      setTimeout(updateCharCount, 10);
    });

    updateCharCount();
  }

  if (form && analyzeBtn) {
    form.addEventListener("submit", function (e) {
      const text = textArea.value.trim();

      if (!text) {
        e.preventDefault();
        showAlert("Please enter some text to analyze.", "warning");
        textArea.focus();
        return;
      }

      if (text.length > 5000) {
        e.preventDefault();
        showAlert(
          "Text is too long. Please limit to 5000 characters.",
          "danger"
        );
        textArea.focus();
        return;
      }

      setLoadingState(true);
      showLoadingOverlay();
    });
  }

  if (textArea) {
    textArea.addEventListener("input", function () {
      this.style.height = "auto";
      this.style.height = this.scrollHeight + "px";
    });
  }

  try {
    if (typeof $ !== "undefined" && $.fn.tooltip) {
      $('[data-toggle="tooltip"]').tooltip();
    }
  } catch (error) {
    console.log("Tooltip initialization skipped:", error.message);
  }

  const progressBars = document.querySelectorAll(".progress-bar");
  progressBars.forEach(function (bar) {
    const width = bar.style.width;
    bar.style.width = "0%";
    setTimeout(function () {
      bar.style.width = width;
    }, 500);
  });

  const sentimentBadge = document.querySelector(".sentiment-badge");
  if (sentimentBadge) {
    sentimentBadge.style.opacity = "0";
    sentimentBadge.style.transform = "scale(0.8)";
    setTimeout(function () {
      sentimentBadge.style.transition = "all 0.5s ease";
      sentimentBadge.style.opacity = "1";
      sentimentBadge.style.transform = "scale(1)";
    }, 300);
  }
});

function clearForm() {
  const textArea = document.getElementById("text");
  const charCount = document.getElementById("char-count");

  if (textArea) {
    textArea.value = "";
    textArea.style.height = "auto";
    textArea.focus();
  }

  if (charCount) {
    charCount.textContent = "0";
    charCount.className = "text-primary font-weight-bold";
  }

  const resultCards = document.querySelectorAll(".card");
  resultCards.forEach(function (card) {
    if (card.querySelector(".sentiment-result")) {
      card.style.display = "none";
    }
  });
}

function analyzeAnother() {
  const textArea = document.getElementById("text");
  if (textArea) {
    textArea.value = "";
    textArea.focus();

    textArea.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  s;
  const charCount = document.getElementById("char-count");
  if (charCount) {
    charCount.textContent = "0";
    charCount.className = "text-primary font-weight-bold";
  }
}

// function shareResult() {
//   const resultText = document.querySelector(".bg-light em");
//   const sentiment = document.querySelector(".sentiment-badge h3");
//   const confidence = document.querySelector(".sentiment-badge p");

//   if (resultText && sentiment && confidence) {
//     const shareText = `Sentiment Analysis Result:\n"${resultText.textContent}"\n\n${sentiment.textContent} - ${confidence.textContent}`;

//     if (navigator.share) {
//       navigator
//         .share({
//           title: "Sentiment Analysis Result",
//           text: shareText,
//           url: window.location.href,
//         })
//         .catch(function (error) {
//           console.log("Error sharing:", error);
//           copyToClipboard(shareText);
//         });
//     } else {
//       copyToClipboard(shareText);
//     }
//   }
// }

// function copyToClipboard(text) {
//   if (navigator.clipboard) {
//     navigator.clipboard
//       .writeText(text)
//       .then(function () {
//         showAlert("Result copied to clipboard!", "success");
//       })
//       .catch(function (error) {
//         console.log("Error copying to clipboard:", error);
//         fallbackCopyToClipboard(text);
//       });
//   } else {
//     fallbackCopyToClipboard(text);
//   }
// }

// function fallbackCopyToClipboard(text) {
//   const textArea = document.createElement("textarea");
//   textArea.value = text;
//   textArea.style.position = "fixed";
//   textArea.style.left = "-999999px";
//   textArea.style.top = "-999999px";
//   document.body.appendChild(textArea);
//   textArea.focus();
//   textArea.select();

//   try {
//     document.execCommand("copy");
//     showAlert("Result copied to clipboard!", "success");
//   } catch (error) {
//     console.log("Error copying to clipboard:", error);
//     showAlert("Could not copy to clipboard. Please copy manually.", "warning");
//   }

//   document.body.removeChild(textArea);
// }

function showAlert(message, type = "warning", duration = 6000) {
  const existingAlerts = document.querySelectorAll(".alert-custom");
  existingAlerts.forEach(function (alert) {
    dismissAlert(alert);
  });

  const alertContainer = document.createElement("div");
  alertContainer.className = `alert alert-${type} alert-dismissible alert-custom`;
  alertContainer.setAttribute("role", "alert");
  alertContainer.style.cssText = `
        position: relative;
        margin: 1rem 0;
        padding: 0.75rem 2.5rem 0.75rem 1rem;
        border: none;
        border-radius: 0.5rem;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        overflow: hidden;
    `;

  const contentWrapper = document.createElement("div");
  contentWrapper.style.cssText = "display: flex; align-items: center;";

  const alertIcon = document.createElement("i");
  alertIcon.className = `fas fa-${getAlertIcon(type)}`;
  alertIcon.style.cssText = `
        margin-right: 0.5rem;
        font-size: 1rem;
        opacity: 0.8;
    `;

  const messageElement = document.createElement("span");
  messageElement.textContent = message;
  messageElement.style.cssText = "flex: 1; font-weight: 500;";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "alert-close-btn";
  closeButton.setAttribute("aria-label", "Close alert");
  closeButton.innerHTML = '<i class="fas fa-times"></i>';

  contentWrapper.appendChild(alertIcon);
  contentWrapper.appendChild(messageElement);
  alertContainer.appendChild(contentWrapper);
  alertContainer.appendChild(closeButton);

  const container = document.querySelector(".container");
  if (container && container.prepend) {
    container.prepend(alertContainer);
  } else if (container && container.firstChild) {
    container.insertBefore(alertContainer, container.firstChild);
  } else if (container) {
    container.appendChild(alertContainer);
  }

  requestAnimationFrame(function () {
    alertContainer.style.opacity = "1";
    alertContainer.style.transform = "translateY(0)";
  });

  closeButton.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    dismissAlert(alertContainer);
  });

  if (duration > 0) {
    const progressBar = document.createElement("div");
    progressBar.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            height: 2px;
            background-color: currentColor;
            opacity: 0.3;
            width: 100%;
            animation: alertProgress ${duration}ms linear forwards;
        `;
    alertContainer.appendChild(progressBar);

    setTimeout(function () {
      if (alertContainer.parentNode) {
        dismissAlert(alertContainer);
      }
    }, duration);
  }

  return alertContainer;
}

function dismissAlert(alertElement) {
  if (!alertElement || !alertElement.parentNode) return;

  alertElement.style.opacity = "0";
  alertElement.style.transform = "translateY(-20px)";
  alertElement.style.maxHeight = alertElement.offsetHeight + "px";

  setTimeout(function () {
    alertElement.style.maxHeight = "0";
    alertElement.style.marginTop = "0";
    alertElement.style.marginBottom = "0";
    alertElement.style.paddingTop = "0";
    alertElement.style.paddingBottom = "0";

    setTimeout(function () {
      if (alertElement.parentNode) {
        alertElement.remove();
      }
    }, 200);
  }, 150);
}

function getAlertIcon(type) {
  const icons = {
    success: "check-circle",
    danger: "exclamation-triangle",
    warning: "exclamation-circle",
    info: "info-circle",
    primary: "info-circle",
  };
  return icons[type] || "info-circle";
}

function setLoadingState(loading) {
  const analyzeBtn = document.getElementById("analyze-btn");
  const textArea = document.getElementById("text");

  if (loading) {
    if (analyzeBtn) {
      analyzeBtn.disabled = true;
      analyzeBtn.classList.add("loading");
      analyzeBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin mr-1"></i> Analyzing...';
    }
    if (textArea) {
      textArea.readOnly = true;
    }
  } else {
    if (analyzeBtn) {
      analyzeBtn.disabled = false;
      analyzeBtn.classList.remove("loading");
      analyzeBtn.innerHTML =
        '<i class="fas fa-brain mr-1"></i> Analyze Sentiment';
    }
    if (textArea) {
      textArea.readOnly = false;
    }
  }
}

function showLoadingOverlay() {
  const existingOverlay = document.getElementById("loading-overlay");
  if (existingOverlay) {
    existingOverlay.remove();
  }
  const overlay = document.createElement("div");
  overlay.id = "loading-overlay";
  overlay.className = "loading-overlay";
  overlay.innerHTML = `
        <div class="simple-loader">
            <div class="loader-circle"></div>
            <p class="loader-text">Analyzing...</p>
        </div>
    `;

  document.body.appendChild(overlay);

  // Animate in
  setTimeout(() => {
    overlay.classList.add("show");
  }, 10);
}

function hideLoadingOverlay() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) {
    overlay.classList.remove("show");
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.remove();
      }
    }, 300);
  }
}

function testAPI(text) {
  if (!text) {
    text =
      "This restaurant is amazing! The food was delicious and the service was excellent.";
  }

  fetch("/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: text }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("API Response:", data);
      return data;
    })
    .catch((error) => {
      console.error("API Error:", error);
      return null;
    });
}

document.addEventListener("keydown", function (e) {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    const form = document.getElementById("sentiment-form");
    if (form) {
      form.dispatchEvent(new Event("submit"));
    }
  }

  if (e.key === "Escape") {
    clearForm();
  }
});

document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

window.addEventListener("load", function () {
  hideLoadingOverlay();
  setLoadingState(false);
  const loadTime = performance.now();
  console.log(`Page loaded in ${loadTime.toFixed(2)}ms`);

  if (performance.getEntriesByType) {
    const navigation = performance.getEntriesByType("navigation")[0];
    if (navigation) {
      console.log("Navigation timing:", {
        "DNS lookup": navigation.domainLookupEnd - navigation.domainLookupStart,
        Connection: navigation.connectEnd - navigation.connectStart,
        Response: navigation.responseEnd - navigation.responseStart,
        "DOM processing":
          navigation.domContentLoadedEventEnd - navigation.responseEnd,
      });
    }
  }
});
document.addEventListener("DOMContentLoaded", function () {
  setTimeout(() => {
    hideLoadingOverlay();
    setLoadingState(false);
  }, 100);
});
