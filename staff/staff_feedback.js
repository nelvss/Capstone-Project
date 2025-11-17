// Initialize feedback page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('📧 Feedback page initializing...');
    
    // Check session before loading
    if (!checkSession()) {
        return;
    }
    
    // Set API URL if not already set (consistent with analytics.js)
    if (!window.API_URL) {
        const metaTag = document.querySelector('meta[name="api-base"]');
        if (metaTag && metaTag.content) {
            // Remove trailing /api if present, we'll add it in requests
            let apiBase = metaTag.content.trim();
            if (apiBase.endsWith('/api')) {
                apiBase = apiBase.slice(0, -4);
            }
            window.API_URL = apiBase;
        } else {
            window.API_URL = 'https://api.otgpuertogaleratravel.com';
        }
    }
    
    // Load feedback from API
    loadFeedback();
    
    console.log('✅ Feedback page fully initialized');
});

// Load feedback from API
async function loadFeedback() {
    const feedbackContainer = document.getElementById('feedback-container');
    if (!feedbackContainer) return;
    
    // Show loading state
    feedbackContainer.innerHTML = `
        <div class="text-center text-muted py-5">
            <i class="fas fa-spinner fa-spin fa-3x mb-3"></i>
            <p>Loading feedback...</p>
        </div>
    `;
    
    try {
        // Fetch feedback from API
        const response = await fetch(`${window.API_URL}/api/feedback`);
        const result = await response.json();
        
        // Clear existing feedback items
        feedbackContainer.innerHTML = '';
        
        if (!result.success || !result.feedback || result.feedback.length === 0) {
            feedbackContainer.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="fas fa-inbox fa-3x mb-3"></i>
                    <p>No feedback messages yet.</p>
                </div>
            `;
            return;
        }
        
        // Convert Supabase feedback to the format expected by createFeedbackItem
        result.feedback.forEach((feedback) => {
            const formattedFeedback = {
                name: feedback.anonymous_name,
                message: feedback.message,
                date: new Date(feedback.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                }),
                timestamp: feedback.feedback_id
            };
            
            const feedbackItem = createFeedbackItem(formattedFeedback);
            feedbackContainer.insertAdjacentHTML('beforeend', feedbackItem);
        });
        
        // Attach event listeners
        attachFeedbackListeners();
        
    } catch (error) {
        console.error('Error loading feedback:', error);
        feedbackContainer.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                <p>Failed to load feedback. Please try again later.</p>
            </div>
        `;
    }
}

// Create feedback item HTML
function createFeedbackItem(feedback) {
    return `
        <div class="feedback-item" data-timestamp="${feedback.timestamp}">
            <div class="feedback-header">
                <div class="feedback-info">
                    <span class="feedback-name">${feedback.name}</span>
                    <span class="feedback-date">${feedback.date}</span>
                </div>
            </div>
            <div class="feedback-message">
                ${feedback.message}
            </div>
            <div class="feedback-actions">
                <button class="btn btn-sm btn-outline-danger delete-feedback">
                    <i class="fas fa-trash me-1"></i>Delete
                </button>
            </div>
        </div>
    `;
}

// Attach event listeners to feedback items
function attachFeedbackListeners() {
    // Delete feedback
    document.querySelectorAll('.delete-feedback').forEach(btn => {
        btn.addEventListener('click', function() {
            if (confirm('Are you sure you want to delete this feedback?')) {
                const feedbackItem = this.closest('.feedback-item');
                const timestamp = feedbackItem.dataset.timestamp;
                deleteFeedback(timestamp);
            }
        });
    });
}

// Delete feedback
async function deleteFeedback(timestamp) {
    if (!timestamp) {
        console.error('No feedback ID provided for deletion');
        alert('Error: No feedback ID provided. Please try again.');
        return;
    }
    
    try {
        const url = `${window.API_URL}/api/feedback/${timestamp}`;
        console.log('Deleting feedback:', url);
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Check if response is ok
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Delete request failed:', response.status, errorText);
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Delete response:', result);
        
        if (result.success) {
            // Show success message
            alert('Feedback deleted successfully');
            // Reload feedback to show updated list
            loadFeedback();
        } else {
            console.error('Failed to delete feedback:', result.message);
            alert(`Failed to delete feedback: ${result.message || 'Please try again.'}`);
        }
    } catch (error) {
        console.error('Error deleting feedback:', error);
        alert(`Failed to delete feedback: ${error.message || 'Please try again later.'}`);
    }
}

