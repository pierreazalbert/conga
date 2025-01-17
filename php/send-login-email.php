<?php
     // Get email argument
     $to  = $_POST['email'];
     $id = $_POST['id'];
     $code = $_POST['code'];

     // Sujet
     $subject = 'Welcome to Conga!';

     // message
     $message = "<!doctype html>
     <html>
     <head>
       <meta charset=\"UTF-8\">
       <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
       <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">
       <meta name=\”x-apple-disable-message-reformatting\”>
       <title>Welcome to Conga!</title>

       <link rel=\"stylesheet\" href=\"https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css\" integrity=\"sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh\" crossorigin=\"anonymous\">
       <script src=\"https://code.jquery.com/jquery-3.5.1.min.js\" integrity=\"sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=\" crossorigin=\"anonymous\"></script>
       <script src=\"https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js\" integrity=\"sha384-Q6E9RHvbIyZFJoft+2mJbHaEWldlvI9IOYy5n3zV9zzTtmI3UksdQRVvoxMfooAo\" crossorigin=\"anonymous\"></script>
       <script src=\"https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.min.js\" integrity=\"sha384-wfSDF2E50Y2D1uUdj0O3uMBJnjuUD4Ih7YwaYd1iqfktj0Uod8GCExl3Og8ifwB6\" crossorigin=\"anonymous\"></script>

     </head>
     <body>
       <body class=\"bg-light mw-100\" style=\"margin: 0; padding:0;\">
         <div class=\"container\">

           <div class=\"pt-2 pb-5 text-center\">
             <img class=\"d-block mx-auto mb-3\" src=\"https://www.conga.store/assets/opened.svg\" alt=\"\" width=\"500\">
             <h1 class=\"pb-5 font-weight-bold\">Welcome to Conga!</h1>
             <p class=\"lead\">Thank you for registering with us, we hope that Conga successfully helps you manage customer affluence in your shop.</p>
           </div>

           <div class=\"row align-items-center justify-content-center mb-5\">
             <div class=\"col-12 col-lg-4 text-center\">
               <img src=\"https://www.conga.store/assets/calendar.svg\" alt=\"\" width=\"300\">
             </div>
             <div class=\"col-12 col-lg-6 text-center text-lg-left\">
               <h3 class=\"mb-3\">Booking link</h3>
                 <h6 class=\"font-weight-bold mb-3\"><a href=\"https://www.conga.store/$code\">conga.store/$code</a></h6>
                 <p>This is the public link that your customers can use to book their visits to your shop, please share it!</p>
               </div>
             </div>

             <div class=\"row align-items-center justify-content-center mb-5\">
               <div class=\"col-12 col-lg-4 text-center\">
                 <img src=\"https://www.conga.store/assets/settings.svg\" alt=\"\" width=\"300\">
               </div>
               <div class=\"col-12 col-lg-6 text-center text-lg-left\">
                 <h3 class=\"mb-3\">Admin page</h3>
                   <h6 class=\"font-weight-bold mb-3\"><a href=\"https://www.conga.store/admin?key=$id\">conga.store/admin?key=$id</a></h6>
                   <p>You can use your admin panel to control & monitor your queue, consult & print your bookings for the day, print a poster with your shop booking link and update your shops settings.</p><p><b>Keep this link secret, it is your personal key to log into the Conga admin panel!</b></p>
                 </div>
               </div>

               <div class=\"row align-items-center justify-content-center mb-5\">
                 <div class=\"col-12 col-lg-4 text-center\">
                   <img src=\"https://www.conga.store/assets/calendar.svg\" alt=\"\" width=\"300\">
                 </div>
                 <div class=\"col-12 col-lg-6 text-center text-lg-left\">
                   <h3 class=\"mb-3\">Queue display</h3>
                     <h6 class=\"font-weight-bold mb-3\"><a href=\"https://www.conga.store/display?key=$id\">conga.store/display?key=$id</a></h6>
                     <p>You can use the queue display page on a smartphone or tablet posted at the front of your shop to remotely control the queue outside.</p>
                   </div>
                 </div>

               </div>
             </body>
             </html>";

     // Pour envoyer un mail HTML, l'en-tête Content-type doit être défini
     $headers[] = 'MIME-Version: 1.0';
     $headers[] = 'Content-type: text/html; charset=iso-8859-1';

     // En-têtes additionnels
     $headers[] = 'From: Conga.store <donotreply@conga.store>';

     // Envoi
     mail($to, $subject, $message, implode("\r\n", $headers));
?>
