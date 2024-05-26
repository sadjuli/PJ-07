// Comment Class
class Comment {
    constructor(id, text, parentId = null, date = new Date(), rating = 0, isFavorite = false) {
        this.id = id;
        this.text = text;
        this.parentId = parentId;
        this.date = date;
        this.rating = rating;
        this.isFavorite = isFavorite;
    }
}
  
// CommentManager Class
class CommentManager {
    constructor() {
        this.comments = JSON.parse(localStorage.getItem('comments')) || [];
    }
  
    addComment(comment) {
        this.comments.push(comment);
        this.saveComments();
    }
  
    getComments() {
        return this.comments;
    }
  
    updateComment(id, newProperties) {
        const comment = this.comments.find(c => c.id === id);
        Object.assign(comment, newProperties);
        this.saveComments();
    }
  
    saveComments() {
        localStorage.setItem('comments', JSON.stringify(this.comments));
    }
  
    sortComments(by) {
        if (by === 'date') {
            this.comments.sort((a, b) => new Date(b.date) - new Date(a.date));
        } else if (by === 'rating') {
            this.comments.sort((a, b) => b.rating - a.rating);
        } else if (by === 'replies') {
            this.comments.sort((a, b) => {
                const repliesA = this.comments.filter(c => c.parentId === a.id).length;
                const repliesB = this.comments.filter(c => c.parentId === b.id).length;
                return repliesB - repliesA;
            });
        }
    }
  
    getFavorites() {
        return this.comments.filter(comment => comment.isFavorite);
    }
}

const commentManager = new CommentManager();
const commentText = document.getElementById('comment-text');
const submitComment = document.getElementById('submit-comment');
const errorMessage = document.getElementById('error-message');
const commentList = document.getElementById('comment-list');
const commentParentId = document.getElementById('comment-parent-id');

submitComment.addEventListener('click', () => {
    addComment();
});

function addComment() {
    if (commentText.value.length > 1000) {
        errorMessage.style.display = 'block';
        return;
    }
    
    errorMessage.style.display = 'none';
    const newComment = new Comment(Date.now().toString(), commentText.value, commentParentId.value);
    commentManager.addComment(newComment);
    renderComments();
    commentText.value = '';
    commentParentId.value = '';
}

function renderComments() {
    const comments = commentManager.getComments();
    commentList.innerHTML = '';
    comments.forEach(comment => {
        if (!comment.parentId) {
            renderCommentItem(comment);
        }
    });
    console.log(comments)
}

function renderCommentItem(comment, level = 0) {
    const commentItem = document.createElement('div');
    commentItem.classList.add('comment__item');
    if (level) {
        commentItem.classList.add('comment__item--child')
    }
    console.log(level)
    commentItem.innerHTML = `
        <div class=comment__item-userpic-wrapper>
            <div class="comment__item-userpic"></div>
            <div class="comment__item-date comment__item-date--mobile">${level ? '<span>↪</span>' : ''}${new Date(comment.date).toLocaleString()}</div>
        </div>
        <div class="comment__item-content">
            <div class="comment__item-date comment__item-date--desktop">${level ? '<span>↪</span>' : ''}${new Date(comment.date).toLocaleString()}</div>
            <div class="comment__item-text">${comment.text}</div>
            <div class="comment__item-controls">
                ${level < 1 ? `<div class="comment__item-reply" onclick="replyToComment('${comment.id}')"><span>↪</span> Ответить</div>` : ''}
                <div class="comment__item-favorite" onclick="toggleFavorite('${comment.id}')">${comment.isFavorite ? '<span>♥</span> В избранном' : '<span>♡</span> В избранное'}</div>   
                <div class="comment__item-rating">
                    <div class="comment__item-rating-down" onclick="changeRating('${comment.id}', -1)">-</div>
                    <div class="comment__item-rating-value">${comment.rating}</div>
                    <div class="comment__item-rating-up" onclick="changeRating('${comment.id}', 1)">+</div>
                </div>
            </div>
        </div>
    `;
    commentList.appendChild(commentItem);
  
    const replies = commentManager.getComments().filter(c => c.parentId === comment.id);
    replies.forEach(reply => renderCommentItem(reply, level + 1));
}
  
function toggleFavorite(id) {
    const comment = commentManager.getComments().find(c => c.id === id);
    comment.isFavorite = !comment.isFavorite;
    commentManager.updateComment(id, { isFavorite: comment.isFavorite });
    renderComments();
}

const sortBySelect = document.getElementById('sort-by');
sortBySelect.addEventListener('change', () => {
    commentManager.sortComments(sortBySelect.value);
    renderComments();
});
  
function changeRating(id, delta) {
    const comment = commentManager.getComments().find(c => c.id === id);
    comment.rating += delta;
    commentManager.updateComment(id, { rating: comment.rating });
    renderComments();
}

function replyToComment(parentId) {
    commentParentId.value = parentId
    commentText.focus();
}

commentText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        const parentId = commentText.dataset.parentId || null;
        addComment(parentId);
        commentText.removeAttribute('data-parent-id');
    }
});

const toggleFavoritesButton = document.getElementById('toggle-favorites');
let commentsMode = 'all'
toggleFavoritesButton.addEventListener('click', () => {
    if (commentsMode === 'all') { 
        commentsMode = 'favorites'
        const favoriteComments = commentManager.getFavorites();
        commentList.innerHTML = '';
        favoriteComments.forEach(comment => renderCommentItem(comment));
        toggleFavoritesButton.classList.add('toggle-favorites--active')
    } else if (commentsMode === 'favorites') {
        commentsMode = 'all'
        renderComments();
        toggleFavoritesButton.classList.remove('toggle-favorites--active')
    }
});

renderComments();