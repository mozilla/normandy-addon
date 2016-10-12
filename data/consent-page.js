const yo = require('yo-yo');

// Build the study header
const buildStudyTitle = studyName => {
  const titleText = studyName || 'Participate in a new Firefox Study';
  return yo`<h1>${titleText}</h1>`;
};

// Build the opt-in button
const buildParticipateButton = (buttonText, buttonClasses) => {
  const text = buttonText || `Try ${self.options.addonName}`;
  return yo`
  <button id="install-addon" class=${buttonClasses || 'primary'}>
    ${text}
  </button>`;
};

// Build the list of authors
const buildAuthorsList = authors => {
  const authorsArray = authors.split(', ');
  return yo`<ul>
    ${authorsArray.map(function (author) {
      return yo`<li>${author}</li>`;
    })}
  </ul>`;
};


// Create studyTitle, button, and authorsList
const studyTitle = buildStudyTitle(self.options.studyName);
const participateButton = buildParticipateButton(self.options.buttonText);
const authorsList = buildAuthorsList(self.options.authors);


// Append header & button
const headerElement = document.getElementById('study-header');
      headerElement.appendChild(studyTitle);
      headerElement.appendChild(participateButton);

// Append the list of authors
const authorsElement = document.getElementById('authors');
      authorsElement.appendChild(authorsList);


// Fill in simple text throughout body content
['addonName', 'duration'].forEach(property => {
  const elems = document.getElementsByClassName(property);
  [].forEach.call(elems, elem => {
    yo.update(elem, yo`<span class=${property}>${self.options[property]}</span>`);
  });
});


// Handle button click to opt-in to study
participateButton.addEventListener('click', () => {
  self.port.emit('optedIntoStudy', 'Enabled study');
  const newButton = buildParticipateButton('Installing Addon...', 'disabled');
  yo.update(participateButton, newButton);
});

// Update button when addon is successfully installed
self.port.on('addonInstalled', () => {
  const successMessage = self.options.thankYouText || 'Thank you for participating!';
  const newButton = buildParticipateButton(successMessage, 'success');
  yo.update(participateButton, newButton);
});
