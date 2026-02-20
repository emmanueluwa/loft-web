import { API_URL } from "./config.js";

let selectedSlot = null;

// form elements
const form = document.getElementById("bookingForm");
const serviceSelect = document.getElementById("serviceType");
const dateInput = document.getElementById("appointmentDate");
const timeSlotsContainer = document.getElementById("timeSlotsContainer");
const timeSlotsDiv = document.getElementById("timeSlots");
const submitBtn = document.getElementById("submitBtn");
const errorMessageDiv = document.getElementById("errorMessage");
const successMessageDiv = document.getElementById("successMessage");

//setting minimum date to today
const today = new Date().toISOString().split("T")[0];
dateInput.setAttribute("min", today);

//event listeners
serviceSelect.addEventListener("change", fetchAvailableSlots);
dateInput.addEventListener("change", fetchAvailableSlots);
form.addEventListener("submit", handleSubmit);

async function fetchAvailableSlots() {
  const service = serviceSelect.value;
  const date = dateInput.value;

  if (!service || !date) {
    timeSlotsContainer.style.display = "none";
    return;
  }

  timeSlotsDiv.innerHTML = '<div class="time-slot loading">Loading...</div>';
  timeSlotsContainer.style.display = "block";
  hideMessages();

  try {
    const response = await fetch(
      `${API_URL}/available-slots?date=${date}&service=${encodeURIComponent(service)}`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch available slots");
    }

    const data = await response.json();
    renderTimeSlots(data.available_slots);
  } catch (error) {
    console.error("Error fetching slots:", error);
    showError("Unable to load available time slots. Please try again.");
    timeSlotsContainer.style.display = "none";
  }
}

function renderTimeSlots(slots) {
  timeSlotsDiv.innerHTML = "";
  selectedSlot = null;
  submitBtn.disabled = true;

  if (slots.length === 0) {
    timeSlotsDiv.innerHTML =
      '<p style="text-align: center; color: #666;">No available slots for this date and service.</p>';

    return;
  }

  slots.forEach((slotISO) => {
    const slot = new Date(slotISO);

    const timeString = slot.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const slotDiv = document.createElement("div");
    slotDiv.className = "time-slot";
    slotDiv.textContent = timeString;
    slotDiv.dataset.datetime = slotISO;

    slotDiv.addEventListener("click", () => selectTimeSlot(slotDiv, slotISO));

    timeSlotsDiv.appendChild(slotDiv);
  });
}

function selectTimeSlot(element, datetime) {
  // removing previous selection
  document.querySelectorAll(".time-slot").forEach((slot) => {
    slot.classList.remove("selected");
  });

  //   select new slot
  element.classList.add("selected");
  selectedSlot = datetime;
  submitBtn.disabled = false;
}

async function handleSubmit(e) {
  e.preventDefault();

  if (!selectedSlot) {
    showError("Please select a time slot");
    return;
  }

  //disabling form during submission
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading"></span> Booking...';
  hideMessages();

  const bookingData = {
    customer_name: document.getElementById("customerName").value,
    customer_email: document.getElementById("customerEmail").value,
    customer_phone: document.getElementById("customerPhone").value,
    service_type: serviceSelect.value,
    appointment_start: selectedSlot,
  };

  try {
    const response = await fetch(`${API_URL}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Booking failed");
    }

    //succesfuly booked
    showSuccess(
      "Booking confirmed! We will be in touch shortly to confirm your appointment details.",
    );

    form.reset();
    timeSlotsContainer.style.display = "none";
    selectedSlot = null;
    submitBtn.textContent = "Book Appointment";
    submitBtn.disabled = true;
  } catch (error) {
    console.error("Booking error:", error);
    showError(error.message || "Unable to complete booking. Please try again.");
    submitBtn.textContent = "Book Appointment";
    submitBtn.disabled = false;
  }
}

function showError(message) {
  errorMessageDiv.textContent = message;
  errorMessageDiv.style.display = "block";
  successMessageDiv.style.display = "none";
}

function showSuccess(message) {
  successMessageDiv.textContent = message;
  successMessageDiv.style.display = "block";
  errorMessageDiv.style.display = "none";
}

function hideMessages() {
  errorMessageDiv.style.display = "none";
  successMessageDiv.style.display = "none";
}
