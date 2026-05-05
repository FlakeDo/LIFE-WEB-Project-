
// Interactions AJAX : soumission de réponses, votes

document.addEventListener('DOMContentLoaded', function () {

    // ── Soumission d'une réponse via AJAX ──────────────────────
    var submitBtn = document.getElementById('submit-reply');
    if (submitBtn) {
        submitBtn.addEventListener('click', function () {
            var postId   = document.getElementById('reply-post-id').value;
            var parentId = document.getElementById('reply-parent-id').value;
            var body     = document.getElementById('reply-body').value.trim();

            if (!body) {
                alert('Votre réponse est vide.');
                return;
            }

            // Construire les données du formulaire
            var formData = new FormData();
            formData.append('post_id', postId);
            formData.append('body',    body);
            if (parentId) {
                formData.append('parent_id', parentId);
            }

            // Envoi AJAX vers le endpoint PHP
            fetch(BASE_URL + '/ajax/add_reply.php', {
                method: 'POST',
                body:   formData
            })
            .then(function (res) {
                return res.json();
            })
            .then(function (data) {
                if (data.error) {
                    alert(data.error);
                    return;
                }

                // Insérer la réponse dans la liste sans recharger la page
                var replyList = document.getElementById('reply-list');
                var html = buildReplyHTML(data.reply);
                replyList.insertAdjacentHTML('beforeend', html);

                // Vider le formulaire
                document.getElementById('reply-body').value      = '';
                document.getElementById('reply-parent-id').value = '';
                resetReplyToLabel();
            })
            .catch(function (err) {
                console.error('[forum] Erreur envoi réponse :', err);
            });
        });
    }

    // Vote (délégation d'événement sur tout le document) 
    // On écoute sur document pour attraper aussi les boutons ajoutés dynamiquement
    document.addEventListener('click', function (e) {
        var isUpvote   = e.target.classList.contains('btn-upvote');
        var isDownvote = e.target.classList.contains('btn-downvote');

        if (!isUpvote && !isDownvote) {
            return; // Clic sur autre chose : ignorer
        }

        var controls  = e.target.closest('.vote-controls');
        if (!controls) {
            return;
        }

        var target   = controls.dataset.target;  // 'post' ou 'reply'
        var targetId = controls.dataset.id;
        var value    = isUpvote ? 1 : -1;

        var formData = new FormData();
        formData.append('target',    target);
        formData.append('target_id', targetId);
        formData.append('value',     value);

        fetch(BASE_URL + '/ajax/upvote.php', {
            method: 'POST',
            body:   formData
        })
        .then(function (res) {
            return res.json();
        })
        .then(function (data) {
            if (data.error) {
                alert(data.error);
                return;
            }
            // Mettre à jour l'affichage du score sans recharger
            controls.querySelector('.score').textContent = data.score;
        })
        .catch(function (err) {
            console.error('[forum] Erreur vote :', err);
        });
    });

    // Répondre à une réponse spécifique 
    // Remplit le champ caché parent_id et affiche un label
    document.addEventListener('click', function (e) {
        if (!e.target.classList.contains('btn-reply-to')) {
            return;
        }

        var replyId     = e.target.dataset.replyId;
        var parentInput = document.getElementById('reply-parent-id');
        if (!parentInput) {
            return;
        }

        parentInput.value = replyId;

        // Récupérer le pseudo de l'auteur pour l'afficher dans le label
        var card     = e.target.closest('.reply-card');
        var authorEl = card ? card.querySelector('.reply-meta strong') : null;
        var label    = document.getElementById('replying-to-label');
        var cancelBtn = document.getElementById('cancel-reply-to');

        if (label && authorEl) {
            label.textContent    = '<== Répondre à ' + authorEl.textContent;
            label.style.display  = 'inline';
        }
        if (cancelBtn) {
            cancelBtn.style.display = 'inline';
        }

        // Mettre le focus sur la zone de texte
        var textarea = document.getElementById('reply-body');
        if (textarea) {
            textarea.focus();
        }
    });

    var cancelReply = document.getElementById('cancel-reply-to');
    if (cancelReply) {
        cancelReply.addEventListener('click', function () {
            document.getElementById('reply-parent-id').value = '';
            resetReplyToLabel();
        });
    }

    function resetReplyToLabel() {
        var label     = document.getElementById('replying-to-label');
        var cancelBtn = document.getElementById('cancel-reply-to');
        if (label) {
            label.textContent   = '';
            label.style.display = 'none';
        }
        if (cancelBtn) {
            cancelBtn.style.display = 'none';
        }
    }

});

// construit le HTML d'une réponse
// Exposée en global (window.) pour être utilisée aussi par realtime.js.
// Paramètre : objet reply { id, author, created_at, body, score, parent_id }
window.buildReplyHTML = function (reply) {
    // escapeHTML protège contre les injections XSS
    return '<article class="reply-card" data-reply-id="' + reply.id + '">'
        + '<div class="vote-controls" data-target="reply" data-id="' + reply.id + '">'
        +   '<button class="btn-upvote">▲</button>'
        +   '<span class="score">' + reply.score + '</span>'
        +   '<button class="btn-downvote">▼</button>'
        + '</div>'
        + '<div class="reply-content">'
        +   '<div class="reply-meta">'
        +     '<strong>' + escapeHTML(reply.author) + '</strong>'
        +     '<time>' + escapeHTML(reply.created_at) + '</time>'
        +   '</div>'
        +   '<div class="reply-body">' + escapeHTML(reply.body).replace(/\n/g, '<br>') + '</div>'
        +   '<button class="btn-reply-to btn-link" data-reply-id="' + reply.id + '">Répondre</button>'
        + '</div>'
        + '</article>';
};

// Protège contre les injections XSS côté JS
function escapeHTML(str) {
    var div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}
