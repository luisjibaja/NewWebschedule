# Smart WebSchedule

## Project Overview

Smart WebSchedule is a lightweight web application that allows students in the SMCCCD district to search, select, and visualize course schedules using a CSV dataset. The application simulates a course registration system and provides an interactive calendar view without requiring a backend server.

---

## Team Members

* Qian Zhao
* Luis Prado

---

## Track

Improving SMCCCD

---

## Demo

*(Add your demo link or video here)*
Example: https://your-demo-link.com

---

## GitHub Repository

https://github.com/luisjibaja/NewWebschedule.git

---

## Features

* Filter courses by Term, Subject, and Course
* Keyword search (course title or instructor)
* View course sections with details (CRN, time, instructor, location)
* Add/remove courses to a registered list
* Display selected courses in a calendar view
* Fully client-side application (no backend required)

---

## Technology Stack

* HTML for structure
* CSS (Grid and Flexbox) for layout and responsive design
* JavaScript (Vanilla) for logic, state management, and UI updates
* CSV file as the data source (parsed into JavaScript objects)

---

## Project Structure

* `main.html` → Main UI layout
* `main.css` → Styling and layout
* `main.js` → Application logic and data handling
* `class_data clean.csv` → Course dataset

---

## How It Works

* The application loads and fetches the CSV dataset using JavaScript
* CSV data is parsed into an array of objects
* Filters (term, subject, course, keywords) are applied in memory
* Matching courses are displayed dynamically in the UI
* Users can add sections to a “registered courses” list
* Selected courses are mapped into a calendar view based on days and times

---

## How to Run

1. Open the project in VS Code
2. Install the **Live Server** extension
3. Right-click `main.html`
4. Click **Open with Live Server**

⚠️ Note: Opening the file directly with `file://` will prevent the CSV from loading due to browser restrictions.

---

## Data Source

The application uses a CSV file with the following columns:

CRN, Subject, COURSE, TITLE, COHORT, TYPE, SCHEDULE, TIME IN, TIME OUT, PLATFORM, INSTRUCTOR, INSTRUCTOR EMAIL

---

## Limitations

* No backend or database (data is static)
* No data persistence (refresh resets selections)
* Limited conflict detection between courses
* Calendar assumes consistent formatting of schedule data

---

## Future Improvements

* Add schedule conflict detection
* Store user selections using localStorage
* Improve calendar visualization with time blocks
* Add backend support (Node.js + SQLite)
* Support multiple academic terms dynamically

---

## Notes

This project prioritizes simplicity and rapid development by using a CSV-based data model instead of a traditional backend system, making it ideal for prototyping and demonstration purposes.
