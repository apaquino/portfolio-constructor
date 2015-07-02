$( document ).ready(function() {

  $('.ui.form')
  .form({
    fields: {
      email: {
        identifier  : 'email',
        rules: [
          {
            type   : 'empty',
            prompt : 'Please enter your username (email)'
          },
          {
            type: 'email',
            prompt: 'Please enter a valid email'
          }
        ]
      },
      pass: {
        identifier  : 'pass',
        rules: [
          {
            type   : 'empty',
            prompt : 'Please enter your password'
          },
          {
            type: 'length[6]',
            prompt: 'Please enter a minimum length of 6'
          }
        ]
      }
    },
    on: 'blur',
    inline: 'true'
  })
  ;

})
;
