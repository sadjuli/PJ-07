class Comment {
    id: string;
    text: string;
    parentId: string | null;
    date: Date;
    rating: number;
    isFavorite: boolean;

    constructor(
        id: string,
        text: string,
        parentId: string | null = null,
        date: Date = new Date(),
        rating: number = 0,
        isFavorite: boolean = false
    ) {
        this.id = id;
        this.text = text;
        this.parentId = parentId;
        this.date = date;
        this.rating = rating;
        this.isFavorite = isFavorite;
    }
}
class CommentManager {
    comments: Comment[];

    constructor() {
        this.comments = JSON.parse(localStorage.getItem('comments')) || [];
    }
  
    addComment(comment: Comment): void {
        this.comments.push(comment);
        this.saveComments();
    }
  
    getComments(): Comment[] {
        return this.comments;
    }
  
    updateComment(id: string, newProperties: Partial<Comment>): void {
        const commentItem = this.comments.find(c => c.id === id);
        if (commentItem) {
            Object.assign(commentItem, newProperties);
            this.saveComments();
        }
    }
  
    saveComments(): void {
        localStorage.setItem('comments', JSON.stringify(this.comments));
    }
  
    sortComments(by: 'date' | 'rating' | 'replies'): void {
        if (by === 'date') {
            this.comments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
  
    getFavorites(): Comment[] {
        return this.comments.filter(comment => comment.isFavorite);
    }
}

const commentManager = new CommentManager();
const commentText = document.getElementById('comment-text') as HTMLTextAreaElement;;
const submitComment = document.getElementById('submit-comment') as HTMLButtonElement;
const commentList = document.getElementById('comment-list') as HTMLDivElement;
const commentParentId = document.getElementById('comment-parent-id') as HTMLInputElement;;

if (submitComment) {
    submitComment.addEventListener('click', () => {
        addComment();
    });
}

function addComment(): void {
    const text = commentText && commentText.value ? commentText.value : ''
    const parentId = commentParentId && commentParentId.value ? commentParentId.value : ''
    const newComment = new Comment(Date.now().toString(), text, parentId);
    commentManager.addComment(newComment);
    renderComments();
    commentText.value = '';
    commentParentId.value = '';
}

function renderComments(): void {
    const comments = commentManager.getComments();
    commentList.innerHTML = '';
    comments.forEach(comment => {
        if (!comment.parentId) {
            renderCommentItem(comment);
        }
    });
}

function renderCommentItem(comment: Comment, level: number = 0): void {
    const commentItem = document.createElement('div');
    commentItem.classList.add('comment__item');
    if (level) {
        commentItem.classList.add('comment__item--child')
    }
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
  
function toggleFavorite(id: string): void {
    const comment = commentManager.getComments().find(c => c.id === id);
    comment.isFavorite = !comment.isFavorite;
    commentManager.updateComment(id, { isFavorite: comment.isFavorite });
    renderComments();
}

const sortBySelect = document.getElementById('sort-by') as HTMLSelectElement;
sortBySelect.addEventListener('change', () => {
    commentManager.sortComments(sortBySelect.value as 'date' | 'rating' | 'replies');
    renderComments();
});
  
function changeRating(id: string, delta: number): void {
    const comment = commentManager.getComments().find(c => c.id === id);
    comment.rating += delta;
    commentManager.updateComment(id, { rating: comment.rating });
    renderComments();
}

function replyToComment(parentId: string): void {
    commentParentId.value = parentId
    commentText.focus();
}

commentText.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        const parentId = commentText.dataset.parentId || null;
        addComment(parentId);
        commentText.removeAttribute('data-parent-id');
    }
});

const toggleFavoritesButton = document.getElementById('toggle-favorites') as HTMLButtonElement;
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