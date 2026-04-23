const state = {
    term: '2026 Spring',
    allSections: [],
    subjects: [],
    courses: [],
    sections: [],
    cart: [],
    currentPage: 'schedule',
    currentMonth: new Date(2026, 0, 1)
};

const selectors = {
    termSelect: document.getElementById('termSelect'),
    subjectSelect: document.getElementById('subjectSelect'),
    courseSelect: document.getElementById('courseSelect'),
    keywordInput: document.getElementById('keywordInput'),
    searchButton: document.getElementById('searchButton'),
    navSchedule: document.getElementById('navSchedule'),
    navCalendar: document.getElementById('navCalendar'),
    courseList: document.getElementById('courseList'),
    registeredList: document.getElementById('registeredList'),
    totalUnits: document.getElementById('totalUnits'),
    calendarGrid: document.getElementById('calendarGrid'),
    calendarAction: document.getElementById('calendarAction'),
    prevMonth: document.getElementById('prevMonth'),
    nextMonth: document.getElementById('nextMonth'),
    schedulePage: document.getElementById('schedulePage'),
    calendarPage: document.getElementById('calendarPage')
};

const termOptions = ['2026 Spring'];
const dayMap = {
    M: 'Mon',
    T: 'Tue',
    W: 'Wed',
    Th: 'Thu',
    F: 'Fri',
    S: 'Sat'
};

function fetchSections() {
    fetch('class_data clean.csv')
        .then((response) => response.text())
        .then((csv) => {
            const rows = parseCSV(csv);
            state.allSections = rows
                .filter((row) => row.Subject && row.COURSE)
                .map((row) => ({
                    crn: row.CRN,
                    subject: row.Subject,
                    course: row.COURSE,
                    title: row.TITLE,
                    schedule: row.SCHEDULE || '',
                    days: parseDays(row.SCHEDULE || ''),
                    start: row['TIME IN'] ? parseTime(row['TIME IN']) : null,
                    end: row['TIME OUT'] ? parseTime(row['TIME OUT']) : null,
                    startText: row['TIME IN'] || '',
                    endText: row['TIME OUT'] || '',
                    location: row.PLATFORM || 'TBD',
                    instructor: row.INSTRUCTOR || 'Staff',
                    status: inferStatus(row)
                }));

            state.subjects = [...new Set(state.allSections.map((section) => section.subject))].sort();
            state.courses = [...new Set(state.allSections.map((section) => `${section.subject} ${section.course}`))].sort();
            initSelectors();
            renderCourses();
            updateCalendar();
        })
        .catch((error) => {
            console.error('Unable to load class data:', error);
            selectors.courseList.innerHTML = '<p class="error">Unable to load courses.</p>';
        });
}

function querySections(filters = {}) {
    let results = state.allSections.slice();
    if (filters.subject && filters.subject !== 'All') {
        results = results.filter(s => s.subject === filters.subject);
    }
    if (filters.course && filters.course !== 'All') {
        const [subj, cour] = filters.course.split(' ');
        results = results.filter(s => s.subject === subj && s.course === cour);
    }
    if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        results = results.filter(s => 
            s.title.toLowerCase().includes(kw) || 
            s.instructor.toLowerCase().includes(kw) ||
            s.subject.toLowerCase().includes(kw)
        );
    }
    return results;
}

function parseCSV(csvText) {
    const splitLine = (line) => {
        const regex = /,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/;
        return line.split(regex).map((value) => value.trim().replace(/^"|"$/g, ''));
    };

    const lines = csvText.trim().split(/\r?\n/);
    const headers = splitLine(lines[0]).filter(h => h.trim() !== ''); // Skip empty headers
    return lines.slice(1).map((line) => {
        const values = splitLine(line).slice(1); // Skip the first empty value
        const item = {};
        headers.forEach((header, index) => {
            item[header] = values[index] || '';
        });
        return item;
    });
}

function parseDays(value) {
    if (!value) return [];
    return value.split(',').map((segment) => segment.trim()).filter(Boolean);
}

function parseTime(value) {
    if (!value) return null;
    const [time, period] = value.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let total = hours % 12;
    if (period && period.toUpperCase() === 'PM') total += 12;
    return total * 60 + minutes;
}

function formatTime(minutes) {
    if (minutes === null) return '';
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${suffix}`;
}

function inferStatus(row) {
    if (!row.CRN) return 'Open';
    return row['PLATFORM'] && row['PLATFORM'].toLowerCase().includes('online') ? 'Online' : 'Open';
}

function initSelectors() {
    selectors.termSelect.innerHTML = termOptions.map((term) => `<option value="${term}">${term}</option>`).join('');
    selectors.subjectSelect.innerHTML = ['All', ...state.subjects].map((subject) => `<option value="${subject}">${subject}</option>`).join('');
    selectors.courseSelect.innerHTML = ['All', ...state.courses].map((course) => `<option value="${course}">${course}</option>`).join('');
    selectors.termSelect.value = state.term;

    selectors.subjectSelect.addEventListener('change', refreshCourseOptions);
    selectors.searchButton.addEventListener('click', renderCourses);
    selectors.keywordInput.addEventListener('input', renderCourses);
    selectors.navSchedule.addEventListener('click', () => switchPage('schedule'));
    selectors.navCalendar.addEventListener('click', () => switchPage('calendar'));
    selectors.calendarAction.addEventListener('click', () => switchPage('calendar'));
    selectors.prevMonth.addEventListener('click', () => changeMonth(-1));
    selectors.nextMonth.addEventListener('click', () => changeMonth(1));
}

function refreshCourseOptions() {
    const selectedSubject = selectors.subjectSelect.value;
    const filteredCourses = state.courses.filter((course) => selectedSubject === 'All' || course.startsWith(`${selectedSubject} `));
    selectors.courseSelect.innerHTML = ['All', ...filteredCourses].map((course) => `<option value="${course}">${course}</option>`).join('');
}

function renderCourses() {
    const subjectFilter = selectors.subjectSelect.value;
    const courseFilter = selectors.courseSelect.value;
    const keywordFilter = selectors.keywordInput.value.trim();
    const filteredSections = querySections({subject: subjectFilter, course: courseFilter, keyword: keywordFilter});

    const coursesMap = {};
    filteredSections.forEach(section => {
        const key = `${section.subject} ${section.course}`;
        if (!coursesMap[key]) coursesMap[key] = [];
        coursesMap[key].push(section);
    });

    const courseKeys = Object.keys(coursesMap).sort();
    selectors.courseList.innerHTML = courseKeys.length
        ? courseKeys.map((courseKey) => renderCourseCard(courseKey, coursesMap[courseKey])).join('')
        : '<div class="empty-state">No courses match your filters. Try a different subject or course.</div>';
    attachSectionToggles();
}

function renderCourseCard(courseKey, sections) {
    const [subject, code] = courseKey.split(' ');
    const title = sections[0]?.title || '';
    const rowCount = sections.length;
    return `
        <div class="course-card" data-course="${courseKey}">
            <div class="course-summary">
                <div>
                    <h4>${subject} ${code}</h4>
                    <p>${title}</p>
                </div>
                <div class="course-actions">
                    <button data-action="toggle-sections" data-course="${courseKey}">View Sections</button>
                    <span>${rowCount} sections</span>
                </div>
            </div>
            <div class="section-list" id="sections-${courseKey.replace(/\s+/g, '-')}">
                <div class="section-row header">
                    <div>CRN</div>
                    <div>DAYS</div>
                    <div>START</div>
                    <div>END</div>
                    <div>LOCATION</div>
                    <div>INSTRUCTOR</div>
                    <div></div>
                </div>
                ${sections.map((section) => renderSectionRow(section)).join('')}
            </div>
        </div>
    `;
}

function renderSectionRow(section) {
    const isInCart = state.cart.some((item) => item.crn === section.crn);
    return `
        <div class="section-row">
            <strong>${section.crn}</strong>
            <small>${section.days.join(', ') || 'TBD'}</small>
            <small>${section.startText || '--'}</small>
            <small>${section.endText || '--'}</small>
            <small>${section.location}</small>
            <small>${section.instructor}</small>
            <button data-action="toggle-cart" data-crn="${section.crn}">${isInCart ? 'Remove' : 'Add'}</button>
        </div>
    `;
}

function attachSectionToggles() {
    document.querySelectorAll('[data-action="toggle-sections"]').forEach((button) => {
        button.addEventListener('click', () => {
            const courseKey = button.dataset.course;
            const sectionBlock = document.getElementById(`sections-${courseKey.replace(/\s+/g, '-')}`);
            sectionBlock.classList.toggle('open');
            button.textContent = sectionBlock.classList.contains('open') ? 'Hide Sections' : 'View Sections';
        });
    });

    document.querySelectorAll('[data-action="toggle-cart"]').forEach((button) => {
        button.addEventListener('click', () => {
            const crn = button.dataset.crn;
            const section = state.sections.find((item) => item.crn === crn);
            if (!section) return;
            if (state.cart.some((entry) => entry.crn === crn)) {
                state.cart = state.cart.filter((entry) => entry.crn !== crn);
            } else {
                state.cart.push(section);
            }
            refreshFromCartUpdate();
        });
    });
}

function refreshFromCartUpdate() {
    updateRegisteredList();
    renderCourses();
    updateCalendar();
}

function updateRegisteredList() {
    selectors.registeredList.innerHTML = state.cart.length
        ? state.cart.map((section) => `
            <div class="registered-item">
                <div>
                    <strong>${section.subject} ${section.course}</strong>
                    <small>${section.days.join(', ')} · ${section.startText} - ${section.endText}</small>
                </div>
                <button class="registered-remove" data-crn="${section.crn}">×</button>
            </div>
        `).join('')
        : '<div class="empty-state">No registered courses yet. Add a section to begin.</div>';

    document.querySelectorAll('.registered-remove').forEach((button) => {
        button.addEventListener('click', () => {
            const crn = button.dataset.crn;
            state.cart = state.cart.filter((entry) => entry.crn !== crn);
            refreshFromCartUpdate();
        });
    });

    selectors.totalUnits.textContent = state.cart.length * 3;
}

function switchPage(page) {
    state.currentPage = page;
    selectors.schedulePage.classList.toggle('page-active', page === 'schedule');
    selectors.calendarPage.classList.toggle('page-active', page === 'calendar');
    selectors.navSchedule.classList.toggle('nav-active', page === 'schedule');
    selectors.navCalendar.classList.toggle('nav-active', page === 'calendar');
    if (page === 'calendar') updateCalendar();
}

function changeMonth(direction) {
    state.currentMonth.setMonth(state.currentMonth.getMonth() + direction);
    updateCalendar();
}

function updateCalendar() {
    const month = state.currentMonth.getMonth();
    const year = state.currentMonth.getFullYear();
    const monthName = state.currentMonth.toLocaleString('default', { month: 'long' });
    document.querySelector('.calendar-month').textContent = monthName;
    document.querySelector('.calendar-year').textContent = year;

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    const firstWeekday = startDate.getDay();
    const totalDays = endDate.getDate();

    const days = [];
    for (let i = 0; i < firstWeekday; i += 1) {
        days.push(null);
    }
    for (let day = 1; day <= totalDays; day += 1) {
        days.push(new Date(year, month, day));
    }

    selectors.calendarGrid.innerHTML = days.map((date) => renderCalendarCell(date)).join('');
    populateCalendarEvents();
}

function renderCalendarCell(date) {
    if (!date) {
        return '<div class="calendar-cell empty"></div>';
    }
    const day = date.getDate();
    return `
        <div class="calendar-cell" data-day="${day}">
            <div class="cell-header">
                <span>${day}</span>
                <span>${date.toLocaleString('default', { weekday: 'short' })}</span>
            </div>
            <div class="events" />
        </div>
    `;
}

function populateCalendarEvents() {
    const cells = document.querySelectorAll('.calendar-cell[data-day]');
    cells.forEach((cell) => {
        const dayNumber = Number(cell.dataset.day);
        const date = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth(), dayNumber);
        const weekday = date.toLocaleString('default', { weekday: 'short' });
        const eventsContainer = cell.querySelector('.events');
        if (!eventsContainer) return;

        const events = state.cart.filter((section) => {
            return section.days.some((day) => weekday.startsWith(dayMap[day]));
        });

        eventsContainer.innerHTML = events.map((event) => `
            <span class="event-chip">
                <strong>${event.subject} ${event.course}</strong>
                ${event.startText} - ${event.endText}
            </span>
        `).join('');
    });
}

fetchSections();
