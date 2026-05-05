
// Polling AJAX : nouvelles réponses en temps réel
// Fonctionnement :
//   1. Toutes les POLL_INTERVAL_MS ms, on appelle ajax/get_replies.php
//   2. On passe since_id = dernier ID déjà affiché
//   3. Les nouvelles réponses sont insérées dans #reply-list sans recharger


(function () {

    // Lire l'intervalle de polling depuis la balise <meta> injectée par PHP
    var pollIntervalMs = parseInt(
        document.querySelector('meta[name="poll-interval"]')
            ? document.querySelector('meta[name="poll-interval"]').content
            : '3000',
        10
    );

    // Vérifier qu'on est bien sur une page de discussion
    var thread = document.querySelector('.post-thread');
    if (!thread) {
        return; // Sécurité : ne rien faire si l'élément n'existe pas
    }

    var postId    = thread.dataset.postId;  // ID de la discussion (data-post-id)
    var replyList = document.getElementById('reply-list');
    if (!replyList) {
        return;
    }

    // Dernier ID de réponse déjà rendu (pour ne récupérer que les nouvelles)
    var lastId = getLastRenderedId();

    // Démarrer la boucle de polling
    setInterval(fetchNewReplies, pollIntervalMs);


    // Trouver l'ID le plus grand parmi les réponses déjà affichées
    function getLastRenderedId() {
        var cards = replyList.querySelectorAll('.reply-card[data-reply-id]');
        if (cards.length === 0) {
            return 0;
        }
        var ids = [];
        for (var i = 0; i < cards.length; i++) {
            ids.push(parseInt(cards[i].dataset.replyId, 10));
        }
        return Math.max.apply(null, ids);
    }


    // Appel AJAX pour récupérer les nouvelles réponses
    function fetchNewReplies() {
        var url = BASE_URL
                + '/ajax/get_replies.php?post_id=' + postId
                + '&since_id=' + lastId;

        fetch(url)
        .then(function (res) {
            if (!res.ok) {
                return null;
            }
            return res.json();
        })
        .then(function (data) {
            if (!data || !data.replies || data.replies.length === 0) {
                return; // Pas de nouvelles réponses
            }

            data.replies.forEach(function (reply) {
                // buildReplyHTML est défini dans forum.js (exposé via window.)
                replyList.insertAdjacentHTML('beforeend', buildReplyHTML(reply));
                if (reply.id > lastId) {
                    lastId = reply.id; // Mettre à jour le curseur
                }
            });
        })
        .catch(function (err) {
            console.error('[realtime] Erreur polling :', err);
        });
    }

})();
