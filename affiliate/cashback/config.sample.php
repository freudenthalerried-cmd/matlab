<?php
// Kopie als config.php per FTP hochladen (wird nie ins Git übernommen).
return [
    'db_dsn'  => 'mysql:host=localhost;dbname=DBNAME;charset=utf8mb4',
    'db_user' => 'DBUSER',
    'db_pass' => 'DBPASS',

    'site_url'  => 'https://pikko.at/cashback',   // ohne Schrägstrich am Ende
    'basis'     => '/cashback',                   // Unterordner auf der Domain; '' bei eigener Domain
    'site_name' => 'Pikko Cashback',
    'mail_from' => 'noreply@pikko.at',
    'admin_email' => 'freudenthaler.ried@gmail.com',
    'mail_log'  => '',              // nur zum Testen: Pfad, statt Mails zu senden

    'awin_publisher_id' => '',      // Awin → Konto → Publisher-ID
    'awin_token'        => '',      // Awin → API-Credentials (OAuth2-Token)
    'awin_api_base'     => 'https://api.awin.com',
    'cron_key'          => 'LANGER-ZUFALLSSTRING',  // für cron.php?key=…

    'anteil'         => 0.5,        // 50 % der Provision gehen als Cashback an den Kunden
    'min_auszahlung' => 2000,       // in Cent (20 €)

    'betreiber' => [
        'name'    => 'Stefan Freudenthaler',
        'adresse' => 'Marwach 5, 4312 Ried in der Riedmark, Österreich',
        'email'   => 'freudenthaler.ried@gmail.com',
    ],
];
