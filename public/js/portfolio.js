$( document ).ready(function() {

  $('.ui.form')
  .form({
    fields: {
      name: {
        identifier: 'name',
        rules: [
          {
            type: 'empty',
            prompt: 'Please enter a portfolio name'
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
