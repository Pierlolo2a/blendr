{\rtf1\ansi\ansicpg1252\cocoartf2868
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Arial-BoldMT;\f1\fswiss\fcharset0 ArialMT;}
{\colortbl;\red255\green255\blue255;\red255\green255\blue255;\red26\green27\blue28;\red229\green229\blue229;
}
{\*\expandedcolortbl;;\cssrgb\c100000\c100000\c100000;\cssrgb\c13725\c14118\c14510;\cssrgb\c91765\c91765\c91765;
}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\deftab720
\pard\pardeftab720\sa160\partightenfactor0

\f0\b\fs24 \cf2 \cb3 \expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 BLENDR \'97 Document de Sp\'e9cification Complet\
\pard\pardeftab720\partightenfactor0

\f1\b0\fs32 \cf4 \cb4 \strokec4 \
\pard\pardeftab720\sa160\partightenfactor0

\f0\b \cf2 \cb3 \strokec2 1. Vision G\'e9n\'e9rale\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0 \cf2 Blendr est un jeu web multijoueur en temps r\'e9el inspir\'e9 du t\'e9l\'e9phone arabe. Le concept repose sur la d\'e9formation progressive d'un message \'e0 travers une cha\'eene de joueurs qui alternent entre des phases de description (textuelle ou vocale) et des phases de dessin. Le jeu se joue dans un navigateur, sans installation, sans cr\'e9ation de compte, et fonctionne sur desktop comme sur mobile. L'identit\'e9 visuelle du site repose sur un fond sombre (#1a1a2e), des accents en violet (#6C63FF), corail (#FF6B6B), et jaune (#FFD93D), avec du texte blanc (#FFFFFF). Le logo Blendr dont les lettres se d\'e9gradent de gauche \'e0 droite est l'\'e9l\'e9ment central de l'identit\'e9 du site et appara\'eet sur toutes les pages.\
\pard\pardeftab720\partightenfactor0
\cf4 \cb4 \strokec4 \
\pard\pardeftab720\sa160\partightenfactor0

\f0\b \cf2 \cb3 \strokec2 2. Architecture Technique\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0 \cf2 Le projet repose sur un serveur Node.js avec Express pour servir les pages et g\'e9rer les routes, et Socket.IO pour toute la communication temps r\'e9el entre les joueurs. Le front-end est en HTML5, CSS3 et JavaScript vanilla, sans framework. Le canvas HTML5 est utilis\'e9 pour toutes les phases de dessin. L'API MediaRecorder du navigateur est utilis\'e9e pour l'enregistrement vocal en mode Audio. Le stockage des parties en cours se fait en m\'e9moire sur le serveur via un objet JavaScript qui contient toutes les rooms actives avec leurs joueurs, leurs param\'e8tres, et leurs cha\'eenes en cours. Aucune base de donn\'e9es n'est n\'e9cessaire pour le MVP \'97 les donn\'e9es de parties termin\'e9es sont sauvegard\'e9es en localStorage c\'f4t\'e9 client pour l'historique. Les dessins sont convertis en base64 via canvas.toDataURL() et transmis comme des strings via Socket.IO. Les enregistrements vocaux sont convertis en blobs puis en base64 pour le transport.\
La structure des fichiers du projet est la suivante. \'c0 la racine, le fichier server.js contient toute la logique serveur, la gestion des rooms, des tours, des timers, des \'e9v\'e9nements Socket.IO, et la d\'e9tection des collisions/d\'e9connexions. Le fichier package.json contient les d\'e9pendances (express, socket.io, uuid pour la g\'e9n\'e9ration de codes). Un dossier /public contient tous les fichiers statiques servis au client. Dans /public, on trouve index.html (page d'accueil), lobby.html (salle d'attente), game.html (page de jeu qui g\'e8re tous les types de tours), reveal.html (page de r\'e9v\'e9lation des cha\'eenes), results.html (page de r\'e9sultats finaux et votes), howtoplay.html (page d'explication des r\'e8gles). Le dossier /public/css contient style.css (styles globaux et th\'e8me), animations.css (toutes les animations et transitions), et responsive.css (adaptations mobile et tablette). Le dossier /public/js contient app.js (logique globale, connexion socket, navigation), lobby.js (logique du lobby), canvas.js (moteur de dessin, outils, sabotages), audio.js (enregistrement et lecture vocale), game.js (logique des tours et transitions), reveal.js (logique de r\'e9v\'e9lation synchronis\'e9e), results.js (votes et affichage des r\'e9sultats), avatars.js (g\'e9n\'e9ration d'avatars al\'e9atoires), sounds.js (gestion de tous les effets sonores), et utils.js (fonctions utilitaires partag\'e9es). Le dossier /public/assets contient /sounds (tous les fichiers audio mp3 pour les effets sonores), /fonts (la police personnalis\'e9e utilis\'e9e sur le site), et /img (le logo Blendr en diff\'e9rentes tailles, le favicon, et les images d'illustration pour la page "Comment jouer").\
\pard\pardeftab720\partightenfactor0
\cf4 \cb4 \strokec4 \
\pard\pardeftab720\sa160\partightenfactor0

\f0\b \cf2 \cb3 \strokec2 3. Page d'Accueil (index.html)\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0 \cf2 La page d'accueil est la porte d'entr\'e9e du jeu. Le fond est en #1a1a2e, identique au fond du logo. Au centre de la page, le logo Blendr est affich\'e9 en grand avec une animation d'entr\'e9e \'97 les lettres apparaissent une par une de gauche \'e0 droite, chacune avec sa d\'e9gradation progressive, en 2 secondes. Le tagline "Draw. Guess. Lose the plot." appara\'eet en fondu en dessous du logo apr\'e8s l'animation.\
En dessous du logo, deux blocs principaux sont pr\'e9sent\'e9s c\'f4te \'e0 c\'f4te sur desktop et empil\'e9s sur mobile. Le premier bloc est "Cr\'e9er une partie" avec un champ de saisie pour le pseudo du joueur (entre 2 et 16 caract\'e8res, pas de caract\'e8res sp\'e9ciaux sauf underscore et tiret), un espace d'avatar (voir section avatars), et un bouton "Cr\'e9er" en violet (#6C63FF) avec un hover qui l'\'e9claircit l\'e9g\'e8rement. Le deuxi\'e8me bloc est "Rejoindre une partie" avec le m\'eame champ pseudo, le m\'eame espace avatar, un champ pour entrer le code d'invitation \'e0 5 caract\'e8res (en majuscules, auto-format\'e9), et un bouton "Rejoindre" en corail (#FF6B6B).\
Le champ pseudo v\'e9rifie en temps r\'e9el que la longueur est correcte et que les caract\'e8res sont valides. Si le pseudo est vide ou invalide au moment du clic, le champ tremble avec une animation shake et un message d'erreur appara\'eet en rouge en dessous. Si le code d'invitation est invalide ou ne correspond \'e0 aucune room, un message d'erreur appara\'eet \'e9galement. Si la room est pleine ou la partie d\'e9j\'e0 en cours, un message sp\'e9cifique indique le probl\'e8me.\
En bas de la page, trois liens discrets en blanc semi-transparent : "Comment jouer", "Historique de mes parties", et un toggle pour couper/activer les sons du site. Un petit texte "Made with chaos" avec un lien vers le repo GitHub du projet est affich\'e9 tout en bas.\
Si le joueur arrive sur la page via un lien d'invitation (blendr.gg/join/XKF92 par exemple), le champ code est pr\'e9rempli automatiquement et le bloc "Rejoindre" est mis en avant visuellement.\
\pard\pardeftab720\partightenfactor0
\cf4 \cb4 \strokec4 \
\pard\pardeftab720\sa160\partightenfactor0

\f0\b \cf2 \cb3 \strokec2 4. Syst\'e8me d'Avatars\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0 \cf2 Chaque joueur a un avatar g\'e9n\'e9r\'e9 al\'e9atoirement. L'avatar est un petit visage rond compos\'e9 de plusieurs \'e9l\'e9ments combin\'e9s al\'e9atoirement : la forme du visage (rond, carr\'e9 arrondi, ovale), la couleur de fond (parmi une palette de 12 couleurs vives), les yeux (10 styles diff\'e9rents \'97 ronds, en trait, \'e9toiles, croix, lunettes, etc.), la bouche (8 styles \'97 sourire, trait, dents, langue tir\'e9e, zigzag, etc.), et un accessoire optionnel (chapeau, couronne, bandeau, n\'9cud papillon, antennes, rien). L'avatar est g\'e9n\'e9r\'e9 en SVG directement dans le navigateur, ce qui le rend l\'e9ger et scalable. Un bouton "d\'e9" \'e0 c\'f4t\'e9 de l'avatar permet de re-g\'e9n\'e9rer un avatar al\'e9atoire. Le joueur clique autant de fois qu'il veut jusqu'\'e0 trouver un avatar qui lui pla\'eet. L'avatar est stock\'e9 en localStorage pour \'eatre r\'e9utilis\'e9 \'e0 la prochaine visite. Le seed de l'avatar est transmis au serveur pour que tous les joueurs voient les m\'eames avatars.\
\pard\pardeftab720\partightenfactor0
\cf4 \cb4 \strokec4 \
\pard\pardeftab720\sa160\partightenfactor0

\f0\b \cf2 \cb3 \strokec2 5. Cr\'e9ation de Partie et Configuration (Host)\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0 \cf2 Quand le host clique sur "Cr\'e9er", il arrive sur l'\'e9cran de configuration de la partie. Cet \'e9cran est un panneau centr\'e9 sur le fond sombre avec le code d'invitation affich\'e9 en tr\'e8s grand en haut (format : 5 caract\'e8res alphanum\'e9riques en majuscules, g\'e9n\'e9r\'e9 avec uuid et tronqu\'e9). \'c0 c\'f4t\'e9 du code, un bouton "Copier" qui copie le code dans le presse-papier avec un feedback visuel (le texte du bouton change en "Copi\'e9 !" pendant 2 secondes). En dessous du code, un bouton "Copier le lien" qui copie l'URL compl\'e8te d'invitation. Un bouton "QR Code" qui affiche un QR code scannable contenant le lien d'invitation, utile quand les potes sont physiquement \'e0 c\'f4t\'e9. Des boutons de partage rapide pour WhatsApp, Discord, et Telegram qui ouvrent directement le partage avec un message pr\'e9-rempli ("Rejoins ma partie Blendr ! Code : XKF92 \'97 blendr.gg/join/XKF92").\
En dessous, les options de configuration de la partie. Le premier param\'e8tre est le choix du mode de jeu, pr\'e9sent\'e9 sous forme de trois cartes visuelles s\'e9lectionnables. La carte "Classique" avec une ic\'f4ne de crayon et texte, une br\'e8ve description "\'c9cris, dessine, devine \'97 le t\'e9l\'e9phone arabe classique", et la couleur de bordure en violet quand s\'e9lectionn\'e9e. La carte "Audio" avec une ic\'f4ne de micro, la description "Parle, dessine, devine \'97 le vrai t\'e9l\'e9phone arabe", et une bordure en corail. La carte "Sabotage" avec une ic\'f4ne d'\'e9clair, la description "Comme le classique, mais le canvas devient fou", et une bordure en jaune. Une seule carte peut \'eatre s\'e9lectionn\'e9e \'e0 la fois. Chaque carte a un hover anim\'e9 qui la soul\'e8ve l\'e9g\'e8rement.\
Le deuxi\'e8me param\'e8tre est le temps de dessin, pr\'e9sent\'e9 sous forme de boutons radio visuels : 15 secondes (libell\'e9 "Speed"), 30 secondes (libell\'e9 "Normal"), 60 secondes (libell\'e9 "Relax"), 90 secondes (libell\'e9 "Artiste"). La valeur par d\'e9faut est 30 secondes.\
Le troisi\'e8me param\'e8tre est le temps de description (texte ou audio selon le mode), aussi en boutons radio : 10 secondes, 20 secondes, 30 secondes, 60 secondes. La valeur par d\'e9faut est 20 secondes.\
Le quatri\'e8me param\'e8tre est le nombre de tours dans la cha\'eene. Le mode "Auto" est s\'e9lectionn\'e9 par d\'e9faut \'97 le nombre de tours est \'e9gal au nombre de joueurs, ce qui fait que chaque joueur participe exactement une fois \'e0 chaque cha\'eene. Le mode "Manuel" permet au host de choisir un nombre sp\'e9cifique de tours (entre 4 et 20). Si le nombre de tours est sup\'e9rieur au nombre de joueurs, les joueurs repassent plusieurs fois dans la cha\'eene.\
Le cinqui\'e8me param\'e8tre est l'activation du Vote & Roast, un toggle switch activ\'e9 par d\'e9faut. Quand il est activ\'e9, une phase de vote appara\'eetra apr\'e8s la r\'e9v\'e9lation.\
Le sixi\'e8me param\'e8tre est le mode NSFW, un toggle switch d\'e9sactiv\'e9 par d\'e9faut. Quand il est activ\'e9, un avertissement appara\'eet pour pr\'e9venir que le contenu peut \'eatre adulte et que le filtre de mots est d\'e9sactiv\'e9. Le toggle a une couleur rouge pour bien le distinguer.\
Le septi\'e8me param\'e8tre est la th\'e9matique des phrases de d\'e9part. Un menu d\'e9roulant avec les options suivantes : "Libre" (pas de contrainte, par d\'e9faut), "Animaux", "Films & S\'e9ries", "Situations absurdes", "Personnages c\'e9l\'e8bres", "Nourriture", "\'c9motions", "Lieux", "M\'e9tiers", "M\'e9lange al\'e9atoire". Quand une th\'e9matique est choisie, les joueurs re\'e7oivent un mot ou une situation de d\'e9part impos\'e9e tir\'e9e d'une banque pr\'e9-\'e9crite au lieu d'inventer leur propre phrase. En mode "Libre", les joueurs \'e9crivent ce qu'ils veulent.\
En bas de l'\'e9cran de configuration, la liste des joueurs connect\'e9s au lobby s'affiche en temps r\'e9el au fur et \'e0 mesure qu'ils rejoignent, avec leur pseudo et avatar. Le bouton "Lancer la partie" est gris\'e9 et inactif tant qu'il y a moins de 3 joueurs. Quand 3 joueurs ou plus sont pr\'e9sents, le bouton devient actif en violet avec une l\'e9g\'e8re animation de pulsation pour attirer l'attention.\
\pard\pardeftab720\partightenfactor0
\cf4 \cb4 \strokec4 \
\pard\pardeftab720\sa160\partightenfactor0

\f0\b \cf2 \cb3 \strokec2 6. Lobby (Salle d'Attente)\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0 \cf2 Le lobby est l'\'e9cran que voient les joueurs qui ne sont pas le host apr\'e8s avoir rejoint avec le code. En haut, le nom de la room et le mode de jeu s\'e9lectionn\'e9 sont affich\'e9s. Les param\'e8tres de la partie sont visibles en r\'e9sum\'e9 (temps de dessin, temps de description, nombre de tours, Vote & Roast activ\'e9 ou non, th\'e9matique).\
Au centre, la liste de tous les joueurs connect\'e9s avec leur avatar, leur pseudo, et un indicateur de statut. Chaque joueur a un bouton "Pr\'eat" qui toggle entre "Pr\'eat" (vert) et "Pas pr\'eat" (gris). Le host voit le statut de chaque joueur. Le host est identifi\'e9 par une petite couronne \'e0 c\'f4t\'e9 de son pseudo.\
En bas, un chat textuel simple permet aux joueurs de discuter en attendant. Le chat supporte les messages texte uniquement, pas d'images ni de liens. Les messages sont affich\'e9s avec le pseudo et la couleur de l'avatar du joueur. Le chat est scrollable et les nouveaux messages font d\'e9filer automatiquement vers le bas. Une limite de 200 caract\'e8res par message. Un filtre basique bloque les messages vides.\
Quand un joueur rejoint le lobby, une notification appara\'eet dans le chat ("PlayerName a rejoint la partie") et un son de "pop" est jou\'e9. Quand un joueur quitte, m\'eame chose ("PlayerName a quitt\'e9 la partie"). La liste des joueurs se met \'e0 jour en temps r\'e9el.\
Si le host quitte, le r\'f4le de host est automatiquement transf\'e9r\'e9 au joueur qui a rejoint le plus t\'f4t apr\'e8s lui. Un message dans le chat annonce le transfert.\
Le bouton "Lancer la partie" n'est visible que par le host. Quand le host clique dessus, un d\'e9compte de 3 secondes s'affiche en grand sur l'\'e9cran de tous les joueurs ("3... 2... 1... GO!") avec un son de d\'e9compte, puis la partie commence.\
Un joueur peut quitter le lobby \'e0 tout moment avec un bouton "Quitter" qui le ram\'e8ne \'e0 l'accueil apr\'e8s confirmation.\
Le lobby supporte un maximum de 12 joueurs par partie. Si un 13\'e8me joueur essaie de rejoindre, il re\'e7oit un message "Partie pleine".\
Un bouton "Mode spectateur" est disponible pour ceux qui veulent regarder sans jouer. Les spectateurs apparaissent dans une liste s\'e9par\'e9e en dessous des joueurs actifs, avec une ic\'f4ne d'\'9cil \'e0 c\'f4t\'e9 de leur pseudo. Ils ne participent pas aux tours mais voient la r\'e9v\'e9lation et peuvent voter au Vote & Roast.\
\pard\pardeftab720\partightenfactor0
\cf4 \cb4 \strokec4 \
\pard\pardeftab720\sa160\partightenfactor0

\f0\b \cf2 \cb3 \strokec2 7. Phase de Jeu \'97 Fonctionnement G\'e9n\'e9ral\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0 \cf2 Une fois la partie lanc\'e9e, le jeu fonctionne en tours successifs. Au premier tour, chaque joueur re\'e7oit une phase d'\'e9criture (ou d'enregistrement vocal en mode Audio) pour cr\'e9er le message de d\'e9part de sa cha\'eene. Ensuite, les tours alternent : le tour 2 est un tour de dessin (chaque joueur re\'e7oit la phrase d'un autre joueur et doit la dessiner), le tour 3 est un tour de description (chaque joueur re\'e7oit le dessin d'un autre joueur et doit le d\'e9crire), et ainsi de suite en alternant dessin et description.\
Le syst\'e8me de distribution des cha\'eenes fonctionne en rotation circulaire. Si les joueurs sont A, B, C, D, alors la cha\'eene initi\'e9e par A passe \'e0 B, puis C, puis D. La cha\'eene initi\'e9e par B passe \'e0 C, puis D, puis A. Chaque joueur ne voit jamais deux fois la m\'eame cha\'eene et ne retombe jamais sur sa propre cha\'eene (sauf si le nombre de tours d\'e9passe le nombre de joueurs en mode manuel).\
Chaque tour a un timer visible par tous les joueurs. Le timer est affich\'e9 en grand en haut de l'\'e9cran avec une barre de progression color\'e9e qui se r\'e9duit. Quand il reste 5 secondes, la barre passe en rouge et le contour de l'\'e9cran clignote en rouge comme avertissement. Un son de tic-tac acc\'e9l\'e9r\'e9 se joue dans les 5 derni\'e8res secondes. Quand le timer atteint 0, le tour se termine automatiquement et le contenu actuel est envoy\'e9 (la phrase en cours, le dessin en cours, ou l'enregistrement en cours).\
Si tous les joueurs terminent avant le timer (en cliquant sur "Termin\'e9"), le tour se termine imm\'e9diatement pour tout le monde. Un indicateur en bas de l'\'e9cran montre "3/5 joueurs ont termin\'e9" pour que chacun sache o\'f9 en sont les autres.\
Entre chaque tour, un \'e9cran de transition de 3 secondes affiche "Tour suivant..." avec une animation et le num\'e9ro du tour. Un indicateur de progression montre "Tour 3/8" pour que les joueurs sachent combien de tours il reste.\
\pard\pardeftab720\partightenfactor0
\cf4 \cb4 \strokec4 \
\pard\pardeftab720\sa160\partightenfactor0

\f0\b \cf2 \cb3 \strokec2 8. Phase de Jeu \'97 Tour d'\'c9criture (Mode Classique & Sabotage)\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0 \cf2 L'\'e9cran de tour d'\'e9criture est compos\'e9 du timer en haut, d'une zone contextuelle au centre, et d'un champ de saisie en bas. Au premier tour, la zone contextuelle affiche simplement "\'c9cris une phrase que les autres devront dessiner !" avec la th\'e9matique si elle a \'e9t\'e9 choisie (ex: "Th\'e9matique : Animaux \'97 \'c9cris quelque chose en rapport avec les animaux"). Si la th\'e9matique est "Libre", le joueur \'e9crit ce qu'il veut. Si une th\'e9matique sp\'e9cifique est choisie et que le mode est en suggestion impos\'e9e, un mot ou une situation est affich\'e9e directement et le joueur n'a pas \'e0 \'e9crire (il passe directement au tour suivant).\
Aux tours suivants (tours de description), la zone contextuelle affiche le dessin du joueur pr\'e9c\'e9dent en grand, bien centr\'e9, et en dessous le champ texte avec le placeholder "D\'e9cris ce dessin en une phrase...". Le joueur doit d\'e9crire ce qu'il voit.\
Le champ texte a une limite de 150 caract\'e8res. Un compteur de caract\'e8res restants est affich\'e9 \'e0 c\'f4t\'e9 du champ. Un minimum de 3 mots est requis pour valider \'97 si le joueur essaie de valider avec moins, un message d'erreur appara\'eet. En mode non-NSFW, un filtre basique de mots inappropri\'e9s est appliqu\'e9 \'97 si un mot bloqu\'e9 est d\'e9tect\'e9, le joueur est invit\'e9 \'e0 reformuler.\
Un bouton "Termin\'e9" en violet permet de valider sa r\'e9ponse avant la fin du timer. Une fois cliqu\'e9, le joueur passe sur l'\'e9cran d'attente et ne peut plus modifier sa phrase.\
\pard\pardeftab720\partightenfactor0
\cf4 \cb4 \strokec4 \
\pard\pardeftab720\sa160\partightenfactor0

\f0\b \cf2 \cb3 \strokec2 9. Phase de Jeu \'97 Tour d'Enregistrement Vocal (Mode Audio)\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0 \cf2 L'\'e9cran d'enregistrement vocal est similaire au tour d'\'e9criture mais le champ texte est remplac\'e9 par une interface d'enregistrement audio. Au premier tour, la zone contextuelle affiche "Enregistre un message vocal que les autres devront dessiner !". Aux tours suivants, le dessin du joueur pr\'e9c\'e9dent est affich\'e9 et le joueur doit le d\'e9crire \'e0 voix haute.\
L'interface d'enregistrement comporte un gros bouton rond central en corail avec une ic\'f4ne de micro. Quand le joueur appuie dessus, le bouton devient rouge avec une animation de pulsation et l'enregistrement commence. Un timer sp\'e9cifique \'e0 l'enregistrement appara\'eet (maximum 10 secondes). Quand le joueur appuie \'e0 nouveau ou que les 10 secondes sont atteintes, l'enregistrement s'arr\'eate.\
L'enregistrement est ensuite affich\'e9 sous forme d'un petit player audio avec un bouton play pour r\'e9\'e9couter, la dur\'e9e affich\'e9e, et une forme d'onde visualis\'e9e. Un bouton "R\'e9enregistrer" permet de supprimer l'enregistrement et recommencer tant que le timer global le permet. Un bouton "Termin\'e9" valide l'enregistrement.\
Si le joueur n'enregistre rien avant la fin du timer, un enregistrement vide est envoy\'e9 et un message "[Pas de message vocal]" le remplace dans la cha\'eene.\
Au niveau technique, l'enregistrement utilise l'API MediaRecorder avec le format audio/webm ou audio/ogg selon le navigateur. Le blob audio est converti en base64 pour le transport via Socket.IO. La premi\'e8re fois qu'un joueur utilise le mode Audio, le navigateur demande la permission du microphone \'97 une popup explicative appara\'eet avant pour pr\'e9venir le joueur.\
\pard\pardeftab720\partightenfactor0
\cf4 \cb4 \strokec4 \
\pard\pardeftab720\sa160\partightenfactor0

\f0\b \cf2 \cb3 \strokec2 10. Phase de Jeu \'97 Tour de Dessin (Tous les Modes)\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0 \cf2 L'\'e9cran de dessin est la partie la plus riche de l'interface. En haut, le timer global du tour. En dessous, la phrase \'e0 dessiner (en mode Classique et Sabotage) ou un player audio pour \'e9couter le message vocal (en mode Audio). Le joueur peut r\'e9\'e9couter le vocal autant de fois qu'il veut pendant son tour. En dessous, le canvas de dessin occupe la majeure partie de l'\'e9cran.\
Le canvas a un fond blanc et une taille fixe de 800x600 pixels sur desktop, adapt\'e9 proportionnellement sur mobile. Le dessin se fait \'e0 la souris sur desktop et au doigt sur mobile/tablette. Le multi-touch n'est pas support\'e9 (un seul doigt \'e0 la fois).\
La barre d'outils de dessin est positionn\'e9e en bas du canvas sur desktop et en haut sur mobile (pour ne pas \'eatre cach\'e9e par la main). Les outils disponibles sont les suivants.\
Le crayon est l'outil par d\'e9faut, s\'e9lectionn\'e9 au lancement du tour. Trois tailles de trait sont disponibles : fin (2px), moyen (6px), et \'e9pais (14px). Les tailles sont repr\'e9sent\'e9es par trois cercles de taille croissante, la taille active est surlign\'e9e.\
La palette de couleurs propose 12 couleurs : noir (#000000), blanc (#FFFFFF), gris (#808080), rouge (#FF0000), corail (#FF6B6B), orange (#FFA500), jaune (#FFD93D), vert (#00CC00), bleu ciel (#00BFFF), bleu (#0000FF), violet (#6C63FF), et rose (#FF69B4). La couleur active est entour\'e9e d'un cercle blanc.\
La gomme fonctionne comme le crayon mais dessine en blanc. Sa taille est fixe (20px) et plus grande que le crayon pour faciliter le gommage.\
Le bouton "Annuler" (ic\'f4ne de fl\'e8che retour) annule le dernier trait complet. Les traits sont stock\'e9s dans un tableau d'historique. Chaque trait est un objet contenant le tableau de points, la couleur, et l'\'e9paisseur. L'annulation retire le dernier trait du tableau et redessine tous les traits restants. Un maximum de 50 traits peuvent \'eatre annul\'e9s.\
Le bouton "Tout effacer" (ic\'f4ne de poubelle) efface tout le canvas. Un clic d\'e9clenche une popup de confirmation "Tout effacer ? Cette action est irr\'e9versible." avec deux boutons "Oui" et "Non". Si confirm\'e9, le canvas est vid\'e9 et l'historique des traits est vid\'e9.\
Le bouton "Termin\'e9" valide le dessin et passe en \'e9cran d'attente. Le canvas est converti en base64 via toDataURL('image/png') et envoy\'e9 au serveur.\
Un d\'e9tecteur de canvas vide v\'e9rifie que le joueur a dessin\'e9 au moins quelque chose avant de valider. Si le canvas est enti\'e8rement blanc (comparaison avec un canvas vierge), un message "Tu dois dessiner quelque chose !" appara\'eet et la validation est bloqu\'e9e. Si le timer expire avec un canvas vide, le dessin vide est quand m\'eame envoy\'e9 avec un marqueur sp\'e9cial.\
Sur mobile, un bouton "Plein \'e9cran" permet de passer le canvas en mode plein \'e9cran pour plus de confort de dessin. Les outils se repositionnent en cons\'e9quence.\
\pard\pardeftab720\partightenfactor0
\cf4 \cb4 \strokec4 \
\pard\pardeftab720\sa160\partightenfactor0

\f0\b \cf2 \cb3 \strokec2 11. Mode Sabotage \'97 Effets sur le Canvas\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0 \cf2 En mode Sabotage, chaque tour de dessin est affect\'e9 par un effet al\'e9atoire qui modifie le comportement du canvas. L'effet est tir\'e9 au sort au d\'e9but du tour et un bandeau color\'e9 en haut du canvas annonce l'effet avec une ic\'f4ne et un texte (ex: "\uc0\u9889  MIROIR \'97 Tes contr\'f4les sont invers\'e9s !"). Le bandeau reste visible pendant tout le tour.\
Les effets possibles sont les suivants.\
Le\'a0
\f0\b Tremblement
\f1\b0 \'a0ajoute un d\'e9calage al\'e9atoire de quelques pixels \'e0 chaque point du trait pendant que le joueur dessine. Le trait n'est jamais exactement l\'e0 o\'f9 le curseur se trouve, il oscille de \'b15 pixels dans les deux axes. Le r\'e9sultat donne un trait tremblant et impr\'e9cis.\
Le\'a0
\f0\b Miroir
\f1\b0 \'a0inverse les contr\'f4les horizontalement. Quand le joueur bouge la souris vers la droite, le trait va vers la gauche, et inversement. L'axe vertical reste normal. C'est d\'e9stabilisant mais jouable.\
Le\'a0
\f0\b Daltonien
\f1\b0 \'a0change la couleur du trait automatiquement toutes les 3 secondes. Le joueur choisit une couleur mais elle est remplac\'e9e par une couleur al\'e9atoire \'e0 intervalles r\'e9guliers. La palette reste visible mais ne refl\'e8te pas la couleur r\'e9elle du trait.\
Le\'a0
\f0\b Brouillard
\f1\b0 \'a0place un cercle opaque gris de 200px de diam\'e8tre qui se d\'e9place lentement et al\'e9atoirement sur le canvas, masquant une partie du dessin. Le joueur ne peut pas voir ce qui est sous le brouillard mais les traits sont quand m\'eame dessin\'e9s normalement en dessous. Le brouillard n'appara\'eet pas sur le dessin final envoy\'e9 aux autres joueurs.\
Le\'a0
\f0\b D\'e9lai
\f1\b0 \'a0ajoute un retard de 0.5 secondes entre le mouvement de la souris et l'apparition du trait. Le joueur doit anticiper ses mouvements. Le trait appara\'eet progressivement en suivant le chemin parcouru avec du retard.\
Le\'a0
\f0\b G\'e9ant
\f1\b0 \'a0force la taille du trait \'e0 30px minimum. Les options de taille de la barre d'outils sont d\'e9sactiv\'e9es. Le joueur ne peut faire aucun d\'e9tail fin.\
Le\'a0
\f0\b Fondu
\f1\b0 \'a0fait dispara\'eetre progressivement les traits anciens. Chaque trait commence \'e0 devenir transparent apr\'e8s 10 secondes et dispara\'eet compl\'e8tement apr\'e8s 20 secondes. Le joueur doit dessiner vite et ne peut pas revenir sur d'anciens traits. Le dessin final envoy\'e9 ne contient que les traits encore visibles \'e0 la fin du timer.\
Le\'a0
\f0\b Rotation
\f1\b0 \'a0fait tourner le canvas de 90 degr\'e9s dans le sens horaire toutes les 15 secondes. Le joueur doit s'adapter \'e0 l'orientation changeante. Quatre rotations possibles (0\'b0, 90\'b0, 180\'b0, 270\'b0) en boucle.\
Chaque effet est impl\'e9ment\'e9 c\'f4t\'e9 client uniquement. Le serveur envoie juste le nom de l'effet au d\'e9but du tour, et le client applique les modifications sur les \'e9v\'e9nements du canvas (mousemove, touchmove) ou sur le rendu. Le dessin final envoy\'e9 au serveur est le r\'e9sultat visible sur le canvas, effets inclus (sauf pour le brouillard qui est retir\'e9).\
Un m\'eame effet ne peut pas appara\'eetre deux fois de suite dans la m\'eame partie pour un m\'eame joueur. La distribution des effets est g\'e9r\'e9e par le serveur qui maintient un historique des effets attribu\'e9s.\
\pard\pardeftab720\partightenfactor0
\cf4 \cb4 \strokec4 \
\pard\pardeftab720\sa160\partightenfactor0

\f0\b \cf2 \cb3 \strokec2 12. \'c9cran d'Attente Entre les Tours\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0 \cf2 Quand un joueur termine son tour avant les autres (en cliquant "Termin\'e9" ou \'e0 l'expiration du timer), il voit un \'e9cran d'attente. Cet \'e9cran affiche une animation amusante \'97 une boucle de gribouillis qui se dessinent et s'effacent tout seuls sur un mini-canvas d\'e9coratif. Le texte "En attente des autres joueurs..." est affich\'e9. En dessous, une barre de progression montre combien de joueurs ont termin\'e9 ("3/5 termin\'e9"). Les avatars des joueurs qui ont termin\'e9 sont affich\'e9s avec une coche verte, ceux qui n'ont pas termin\'e9 ont un sablier.\
Le joueur ne peut pas revenir en arri\'e8re pour modifier sa soumission. Il ne peut pas voir ce que les autres joueurs font. Aucun spoiler n'est possible.\
\pard\pardeftab720\partightenfactor0
\cf4 \cb4 \strokec4 \
\pard\pardeftab720\sa160\partightenfactor0

\f0\b \cf2 \cb3 \strokec2 13. Gestion des D\'e9connexions\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0 \cf2 Si un joueur perd sa connexion en cours de partie (fermeture du navigateur, perte de r\'e9seau, crash), le serveur le d\'e9tecte via la d\'e9connexion Socket.IO. Un timer de reconnexion de 30 secondes d\'e9marre. Pendant ces 30 secondes, le joueur est marqu\'e9 comme "D\'e9connect\'e9" dans l'interface des autres joueurs (son avatar devient gris\'e9 avec un symbole de wifi barr\'e9). Si le joueur se reconnecte dans les 30 secondes en retournant sur la page et en entrant le m\'eame code et le m\'eame pseudo, il retrouve sa partie exactement l\'e0 o\'f9 il l'a laiss\'e9e. Si c'\'e9tait son tour, le timer de son tour reprend o\'f9 il en \'e9tait.\
Si les 30 secondes expirent sans reconnexion, le tour actuel du joueur est compl\'e9t\'e9 automatiquement. Pour un tour d'\'e9criture, le texte "[Joueur d\'e9connect\'e9]" est ins\'e9r\'e9 dans la cha\'eene. Pour un tour de dessin, un canvas vide avec un texte "Joueur d\'e9connect\'e9" dessin\'e9 dessus est ins\'e9r\'e9. Pour un tour audio, un silence est ins\'e9r\'e9. Le joueur est retir\'e9 de la rotation pour les tours suivants et son avatar est marqu\'e9 d'une croix rouge dans la liste. La partie continue normalement pour les autres joueurs.\
Si le host se d\'e9connecte, le r\'f4le de host est transf\'e9r\'e9 au joueur suivant dans l'ordre d'arriv\'e9e. Le nouveau host h\'e9rite du contr\'f4le de la r\'e9v\'e9lation (bouton "Suivant").\
Si trop de joueurs se d\'e9connectent et qu'il reste moins de 3 joueurs actifs, la partie est automatiquement termin\'e9e et les cha\'eenes en l'\'e9tat sont envoy\'e9es \'e0 la phase de r\'e9v\'e9lation avec ce qui a \'e9t\'e9 compl\'e9t\'e9.\
\pard\pardeftab720\partightenfactor0
\cf4 \cb4 \strokec4 \
\pard\pardeftab720\sa160\partightenfactor0

\f0\b \cf2 \cb3 \strokec2 14. Phase de R\'e9v\'e9lation\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0 \cf2 La r\'e9v\'e9lation est le moment le plus important du jeu \'97 c'est l\'e0 que tout le monde rigole. Toutes les cha\'eenes sont r\'e9v\'e9l\'e9es une par une, et chaque \'e9tape de chaque cha\'eene est d\'e9voil\'e9e s\'e9quentiellement.\
L'\'e9cran de r\'e9v\'e9lation a un fond sombre avec un \'e9clairage central. Le host contr\'f4le le rythme avec un bouton "Suivant" visible uniquement par lui. Les autres joueurs voient un indicateur "Le host contr\'f4le la r\'e9v\'e9lation".\
La premi\'e8re cha\'eene est annonc\'e9e : "Cha\'eene de [pseudo du joueur qui a \'e9crit la phrase de d\'e9part]" avec son avatar affich\'e9 en grand. Le host clique sur "Suivant" pour r\'e9v\'e9ler la premi\'e8re \'e9tape \'97 la phrase de d\'e9part, qui appara\'eet en grand texte blanc au centre de l'\'e9cran avec une animation de fondu. Si c'est le mode Audio, le message vocal est jou\'e9 automatiquement avec une visualisation de forme d'onde.\
Le host clique sur "Suivant" \'e0 nouveau. La phrase se r\'e9duit vers le haut et le dessin du joueur suivant appara\'eet au centre avec une animation de d\'e9ploiement. Le pseudo et l'avatar du dessinateur sont affich\'e9s en dessous du dessin. Les joueurs r\'e9agissent, rigolent.\
Le host clique sur "Suivant". Le dessin se r\'e9duit vers le haut et la description du joueur suivant appara\'eet en grand texte. Et ainsi de suite, en alternant dessins et descriptions, jusqu'\'e0 la fin de la cha\'eene.\
\'c0 la fin de chaque cha\'eene, un \'e9cran r\'e9capitulatif montre la premi\'e8re phrase de d\'e9part et le dernier \'e9l\'e9ment de la cha\'eene c\'f4te \'e0 c\'f4te pour voir l'\'e9cart entre le d\'e9but et la fin. Un bouton "Cha\'eene suivante" permet de passer \'e0 la cha\'eene du joueur suivant.\
Pendant la r\'e9v\'e9lation, un mini-chat en bas de l'\'e9cran permet aux joueurs de r\'e9agir en temps r\'e9el avec des messages courts. Des boutons de r\'e9action rapide sont aussi disponibles \'97 des emojis cliquables (\uc0\u55357 \u56834 , \u55357 \u56878 , \u55357 \u56448 , \u55357 \u56613 , \u55357 \u56399 , \u55358 \u56622 ) qui s'affichent en animation flottante sur l'\'e9cran de tout le monde quand quelqu'un clique dessus, comme des r\'e9actions en live.\
Les spectateurs voient exactement le m\'eame \'e9cran que les joueurs actifs.\
\pard\pardeftab720\partightenfactor0
\cf4 \cb4 \strokec4 \
\pard\pardeftab720\sa160\partightenfactor0

\f0\b \cf2 \cb3 \strokec2 15. Phase de Vote & Roast\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0 \cf2 Si le Vote & Roast est activ\'e9, cette phase commence apr\'e8s la r\'e9v\'e9lation de toutes les cha\'eenes. L'\'e9cran de vote affiche les cat\'e9gories une par une.\
La premi\'e8re cat\'e9gorie est\'a0
\f0\b "Best Artist"
\f1\b0 \'a0\'97 le meilleur dessin de toute la partie. Tous les dessins de la partie sont affich\'e9s en grille avec le pseudo du dessinateur. Chaque joueur clique sur le dessin qu'il trouve le meilleur. Un joueur ne peut pas voter pour ses propres dessins. Un timer de 30 secondes est donn\'e9 pour voter. Une fois que tout le monde a vot\'e9 ou que le timer expire, les r\'e9sultats sont affich\'e9s avec un podium anim\'e9 \'97 le gagnant appara\'eet en grand au centre avec des confettis.\
La deuxi\'e8me cat\'e9gorie est\'a0
\f0\b "Worst Artist"
\f1\b0 \'a0\'97 le pire dessin. M\'eame fonctionnement mais l'ambiance visuelle est diff\'e9rente \'97 le podium est invers\'e9, le "gagnant" est affich\'e9 avec une animation comique de d\'e9faite.\
La troisi\'e8me cat\'e9gorie est\'a0
\f0\b "Lost in Translation"
\f1\b0 \'a0\'97 la description la plus \'e9loign\'e9e de la r\'e9alit\'e9. Sont affich\'e9es les paires "dessin \uc0\u8594  description" et les joueurs votent pour celle qui est le plus \'e0 c\'f4t\'e9 de la plaque.\
La quatri\'e8me cat\'e9gorie est\'a0
\f0\b "The Poet"
\f1\b0 \'a0\'97 la meilleure description. Les descriptions sont affich\'e9es avec le dessin qu'elles d\'e9crivaient et les joueurs votent pour la plus pr\'e9cise ou cr\'e9ative.\
La cinqui\'e8me cat\'e9gorie est\'a0
\f0\b "Funniest Chain"
\f1\b0 \'a0\'97 la cha\'eene la plus dr\'f4le dans son ensemble. Les cha\'eenes sont affich\'e9es en miniature (d\'e9but \uc0\u8594  fin) et les joueurs votent pour celle qui a le plus d\'e9raill\'e9.\
Chaque cat\'e9gorie suit le m\'eame flow : affichage des candidats, timer de vote, r\'e9sultats avec animation de podium. Les spectateurs peuvent aussi voter.\
\'c0 la fin de toutes les cat\'e9gories, un r\'e9capitulatif global affiche tous les gagnants de chaque cat\'e9gorie.\
\pard\pardeftab720\partightenfactor0
\cf4 \cb4 \strokec4 \
\pard\pardeftab720\sa160\partightenfactor0

\f0\b \cf2 \cb3 \strokec2 16. \'c9cran de R\'e9sultats Final\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0 \cf2 Apr\'e8s le Vote & Roast (ou directement apr\'e8s la r\'e9v\'e9lation si le Vote est d\'e9sactiv\'e9), l'\'e9cran de r\'e9sultats final s'affiche. Cet \'e9cran est un r\'e9capitulatif complet de la partie.\
En haut, un titre "Partie termin\'e9e !" avec le mode de jeu et le nombre de joueurs. Si le Vote \'e9tait activ\'e9, les gagnants de chaque cat\'e9gorie sont affich\'e9s avec leur avatar et pseudo dans des badges color\'e9s.\
En dessous, toutes les cha\'eenes compl\'e8tes sont affich\'e9es en d\'e9filement vertical \'97 chaque cha\'eene est une carte d\'e9pliable qui montre toutes les \'e9tapes du d\'e9but \'e0 la fin. Le joueur peut parcourir les cha\'eenes \'e0 son rythme.\
Un bouton\'a0
\f0\b "T\'e9l\'e9charger"
\f1\b0 \'a0est disponible pour chaque cha\'eene. Le clic g\'e9n\'e8re une image longue assembl\'e9e verticalement contenant toutes les \'e9tapes de la cha\'eene (phrase, dessin, phrase, dessin...) avec le pseudo de chaque contributeur. L'image est g\'e9n\'e9r\'e9e c\'f4t\'e9 client en cr\'e9ant un canvas temporaire qui assemble tous les \'e9l\'e9ments et est export\'e9e en PNG. Le watermark "Blendr \'97 blendr.gg" est ajout\'e9 discr\'e8tement en bas de l'image.\
Un bouton\'a0
\f0\b "Tout t\'e9l\'e9charger"
\f1\b0 \'a0g\'e9n\'e8re un ZIP contenant toutes les cha\'eenes en images s\'e9par\'e9es.\
Un bouton\'a0
\f0\b "Rejouer"
\f1\b0 \'a0ram\'e8ne tout le lobby \'e0 l'\'e9cran de configuration avec les m\'eames joueurs connect\'e9s. Le host peut modifier les param\'e8tres et relancer une partie directement.\
Un bouton\'a0
\f0\b "Quitter"
\f1\b0 \'a0ram\'e8ne le joueur \'e0 la page d'accueil apr\'e8s confirmation.\
Les donn\'e9es de la partie (cha\'eenes, votes, r\'e9sultats) sont sauvegard\'e9es en localStorage pour l'historique.\
\pard\pardeftab720\partightenfactor0
\cf4 \cb4 \strokec4 \
\pard\pardeftab720\sa160\partightenfactor0

\f0\b \cf2 \cb3 \strokec2 17. Page "Comment Jouer" (howtoplay.html)\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0 \cf2 Cette page est accessible depuis la page d'accueil. Elle explique les trois modes de jeu avec des visuels clairs.\
Une introduction en haut explique le concept g\'e9n\'e9ral du jeu en 2-3 phrases. Ensuite, chaque mode est expliqu\'e9 dans sa propre section avec un titre, une ic\'f4ne, une description du d\'e9roulement \'e9tape par \'e9tape illustr\'e9e avec des captures d'\'e9cran fictives ou des GIFs anim\'e9s montrant le gameplay. Un exemple de cha\'eene compl\'e8te est montr\'e9 pour chaque mode \'97 la phrase de d\'e9part, le dessin qui en r\'e9sulte, la description du dessin, le dessin de la description, etc., pour que le joueur comprenne visuellement comment le message se d\'e9forme.\
Une section d\'e9di\'e9e au mode Sabotage montre des GIFs de chaque effet (tremblement, miroir, etc.) pour que les joueurs sachent \'e0 quoi s'attendre.\
Une section explique le Vote & Roast avec les cat\'e9gories et le syst\'e8me de podium.\
En bas, une FAQ rapide r\'e9pond aux questions courantes : "Combien de joueurs minimum ?" (3), "Combien maximum ?" (12), "Faut-il un compte ?" (Non), "\'c7a marche sur mobile ?" (Oui), "Mes dessins sont-ils sauvegard\'e9s ?" (En local seulement).\
\pard\pardeftab720\partightenfactor0
\cf4 \cb4 \strokec4 \
\pard\pardeftab720\sa160\partightenfactor0

\f0\b \cf2 \cb3 \strokec2 18. Historique des Parties\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0 \cf2 Depuis la page d'accueil, le joueur peut acc\'e9der \'e0 l'historique de ses parties pass\'e9es. L'historique est stock\'e9 en localStorage et affiche une liste de parties avec la date, le mode de jeu, le nombre de joueurs, et la liste des pseudos des participants.\
En cliquant sur une partie, le joueur peut revoir toutes les cha\'eenes compl\'e8tes comme sur l'\'e9cran de r\'e9sultats. Il peut re-t\'e9l\'e9charger les images des cha\'eenes. Les donn\'e9es vocales (mode Audio) ne sont pas sauvegard\'e9es en local pour des raisons de taille \'97 seul un texte "[Message vocal]" les remplace.\
Un bouton "Tout supprimer" permet de vider l'historique avec confirmation. Chaque partie peut aussi \'eatre supprim\'e9e individuellement.\
L'historique est limit\'e9 aux 20 derni\'e8res parties pour ne pas surcharger le localStorage. Quand la limite est atteinte, la partie la plus ancienne est supprim\'e9e automatiquement.\
\pard\pardeftab720\partightenfactor0
\cf4 \cb4 \strokec4 \
\pard\pardeftab720\sa160\partightenfactor0

\f0\b \cf2 \cb3 \strokec2 19. Syst\'e8me de Sons et Musique\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0 \cf2 Le site utilise des effets sonores pour enrichir l'exp\'e9rience sans \'eatre envahissant. Tous les sons sont courts et l\'e9gers (format mp3, quelques Ko chacun).\
Les sons utilis\'e9s sont les suivants : un "pop" l\'e9ger quand un joueur rejoint le lobby, un son de d\'e9compte (bip bip bip GO) au lancement de la partie, un "ding" doux au d\'e9but de chaque tour, un tic-tac acc\'e9l\'e9r\'e9 dans les 5 derni\'e8res secondes du timer, un "swoosh" \'e0 la validation du tour, un son de r\'e9v\'e9lation dramatique (roulement de tambour court) \'e0 chaque \'e9tape de la r\'e9v\'e9lation, un son de confettis/victoire pour le podium du Vote & Roast, un "click" discret sur chaque bouton de l'interface, et un son de notification quand c'est le tour du joueur si l'onglet n'est pas actif (utilisation de l'API Notification si la permission est accord\'e9e, sinon juste le son).\
Une musique de fond l\'e9g\'e8re et loopable est jouable dans le lobby et pendant la r\'e9v\'e9lation. La musique est d\'e9sactiv\'e9e par d\'e9faut et activable via un bouton. Le volume de la musique est plus bas que les effets sonores.\
Un toggle global en bas de chaque page permet de couper tous les sons et la musique d'un coup. L'\'e9tat du toggle est sauvegard\'e9 en localStorage.\
\pard\pardeftab720\partightenfactor0
\cf4 \cb4 \strokec4 \
\pard\pardeftab720\sa160\partightenfactor0

\f0\b \cf2 \cb3 \strokec2 20. Responsive Design et Support Mobile\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0 \cf2 Le site est enti\'e8rement responsive et jouable sur mobile, tablette et desktop. Le breakpoint principal est \'e0 768px (en dessous = mobile). Sur mobile, les \'e9l\'e9ments s'empilent verticalement. Les boutons sont plus gros pour \'eatre facilement cliquables au doigt. Le canvas de dessin s'adapte \'e0 la largeur de l'\'e9cran tout en conservant les proportions. La barre d'outils de dessin se repositionne en haut du canvas sur mobile. Le dessin au doigt est fluide gr\'e2ce \'e0 la gestion des \'e9v\'e9nements touch (touchstart, touchmove, touchend) avec prevention du scroll pendant le dessin. Le chat du lobby est masquable en slide pour gagner de la place. Le QR code d'invitation est particuli\'e8rement utile sur mobile. Le mode plein \'e9cran pour le canvas est recommand\'e9 sur mobile pour une meilleure exp\'e9rience.\
Sur tablette, l'exp\'e9rience est optimale car l'\'e9cran est assez grand pour le canvas et le dessin au doigt est naturel. Le layout utilise une disposition interm\'e9diaire entre mobile et desktop.\
\pard\pardeftab720\partightenfactor0
\cf4 \cb4 \strokec4 \
\pard\pardeftab720\sa160\partightenfactor0

\f0\b \cf2 \cb3 \strokec2 21. Accessibilit\'e9\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0 \cf2 Le site prend en compte l'accessibilit\'e9 pour \'eatre utilisable par le maximum de joueurs. Toutes les actions sont r\'e9alisables au clavier (tab pour naviguer, entr\'e9e pour valider). Les couleurs de la palette de dessin sont accompagn\'e9es de labels textuels au survol. Le contraste entre le texte blanc et le fond sombre #1a1a2e respecte les normes WCAG AA. Les boutons ont des tailles minimales de 44x44px pour \'eatre facilement cliquables. Les animations peuvent \'eatre r\'e9duites via une option "R\'e9duire les animations" dans les param\'e8tres du site pour les personnes sensibles au mouvement. Les sons sont accompagn\'e9s de feedback visuels syst\'e9matiquement (un sourd ne rate aucune information). Le focus des \'e9l\'e9ments interactifs est visible avec un contour en violet.\
\pard\pardeftab720\partightenfactor0
\cf4 \cb4 \strokec4 \
\pard\pardeftab720\sa160\partightenfactor0

\f0\b \cf2 \cb3 \strokec2 22. S\'e9curit\'e9 et Anti-Triche\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0 \cf2 Le serveur est l'autorit\'e9 sur toute la logique du jeu. Les timers sont g\'e9r\'e9s c\'f4t\'e9 serveur, pas c\'f4t\'e9 client \'97 le client affiche le timer mais c'est le serveur qui d\'e9cide quand le tour est termin\'e9. Un joueur ne peut pas soumettre de contenu en dehors de son tour. Les soumissions tardives (apr\'e8s expiration du timer c\'f4t\'e9 serveur + marge de 2 secondes pour le r\'e9seau) sont rejet\'e9es.\
Le filtre de contenu inappropri\'e9 en mode non-NSFW utilise une liste de mots bloqu\'e9s c\'f4t\'e9 serveur. Les phrases contenant ces mots sont rejet\'e9es avec un message demandant de reformuler. Le filtre est volontairement basique et non contraignant \'97 il bloque les mots les plus \'e9vidents sans \'eatre excessif.\
Le syst\'e8me de signalement pendant la r\'e9v\'e9lation permet \'e0 chaque joueur de signaler un contenu. Si un contenu est signal\'e9 par plus de 50% des joueurs, il est masqu\'e9 et remplac\'e9 par "[Contenu masqu\'e9 par les joueurs]".\
Les codes d'invitation expirent 5 minutes apr\'e8s la fin de la partie. Les rooms inactives (aucun joueur connect\'e9) sont supprim\'e9es apr\'e8s 2 minutes.\
La taille des donn\'e9es transmises est limit\'e9e : les images canvas en base64 sont limit\'e9es \'e0 2Mo, les enregistrements audio \'e0 500Ko, les messages texte \'e0 150 caract\'e8res. Les soumissions d\'e9passant ces limites sont rejet\'e9es.\
\pard\pardeftab720\partightenfactor0
\cf4 \cb4 \strokec4 \
\pard\pardeftab720\sa160\partightenfactor0

\f0\b \cf2 \cb3 \strokec2 23. Performance et Optimisation\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0 \cf2 Les images canvas sont compress\'e9es en JPEG (qualit\'e9 0.7) au lieu de PNG quand la taille d\'e9passe 500Ko pour r\'e9duire la bande passante. Les enregistrements audio utilisent un bitrate bas (32kbps) suffisant pour la voix. Les \'e9v\'e9nements de dessin en temps r\'e9el ne sont pas transmis aux autres joueurs \'97 seul le r\'e9sultat final est envoy\'e9 \'e0 la fin du tour, ce qui r\'e9duit consid\'e9rablement le trafic r\'e9seau. Les animations CSS utilisent transform et opacity pour rester sur le GPU. Les images des cha\'eenes pass\'e9es sont lazy-loaded dans l'historique. Le serveur nettoie les rooms termin\'e9es et les donn\'e9es en m\'e9moire toutes les 5 minutes. Le nombre maximum de rooms simultan\'e9es est limit\'e9 \'e0 100 pour un serveur basique.\
\pard\pardeftab720\partightenfactor0
\cf4 \cb4 \strokec4 \
\pard\pardeftab720\sa160\partightenfactor0

\f0\b \cf2 \cb3 \strokec2 24. D\'e9ploiement\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0 \cf2 Le projet est d\'e9ployable sur des plateformes gratuites comme Render, Railway, ou Fly.io. Le fichier package.json contient un script "start" qui lance le serveur. Le port est configurable via la variable d'environnement PORT. Le site peut \'eatre servi en HTTPS via les certificats fournis par la plateforme d'h\'e9bergement. Le nom de domaine blendr.gg ou blendr.io peut \'eatre configur\'e9 via un CNAME DNS. Un fichier .env contient les variables d'environnement (PORT, NODE_ENV). Un fichier README.md explique comment installer et lancer le projet en local et en production.\
}