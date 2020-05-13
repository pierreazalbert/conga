<?php
     // Get email argument
     $to  = $_POST['email'];
     $id = $_POST['id'];
     $code = $_POST['code'];

     // Sujet
     $subject = 'Welcome to Conga!';

     // message
     $message = "
     <html>
      <head>
       <title>Welcome to Conga!</title>
      </head>
      <body>
       <p>Here are some useful links that you should keep safe:</p>
       <table>
        <tr>
         <th>Usage</th><th>Link</th><th>Comments</th>
        </tr>
        <tr>
         <td>Admin login</td><td>https://www.conga.store/admin?id=$id</td><td>Keep this link secret, it is your personal key to log into the Conga admin panel</td>
        </tr>
        <tr>
         <td>Public link</td><td>https://www.conga.store/book?shop=$code</td><td>This is the public link that your customers can use to book their visits to your shop, please share it!</td>
        </tr>
       </table>
       <p>Please do not reply to this email.</p>
      </body>
     </html>
     ";

     // Pour envoyer un mail HTML, l'en-tête Content-type doit être défini
     $headers[] = 'MIME-Version: 1.0';
     $headers[] = 'Content-type: text/html; charset=iso-8859-1';

     // En-têtes additionnels
     $headers[] = 'From: Conga.store <donotreply@conga.store>';

     // Envoi
     mail($to, $subject, $message, implode("\r\n", $headers));
?>