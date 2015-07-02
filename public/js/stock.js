$( document ).ready(function() {

  $('.ui.form')
  .form({
    fields: {
      amount: {
        identifier: 'amount',
        rules: [
          {
            type: 'empty',
            prompt: 'Please enter an numeric amount'
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
