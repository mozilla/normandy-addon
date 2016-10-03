const studyValues = [
  'studyName',
  'addonName',
  'duration',
  'authors',
];

studyValues.forEach(property => {
  const elems = document.getElementsByClassName(property);
  [].forEach.call(elems, elem => {
    elem.innerText = self.options[property];
  });
});

const installAddonButton = document.getElementById('installAddon');
installAddonButton.innerText = self.options.buttonText || `Try ${self.options.addonName}`;

installAddonButton.addEventListener('click', () => {
  self.port.emit('optedIntoStudy', 'Enabled study');
  installAddonButton.innerText = 'Installing Addon...';
});

self.port.on('addonInstalled', () => {
  installAddonButton.innerText = self.options.thankYouText || 'Thank you for participating!';
  installAddonButton.classList.add('success');
});
