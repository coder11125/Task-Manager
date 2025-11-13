// ============================================
// TASK MANAGER APPLICATION
// ============================================

class TaskManager {
    constructor() {
        // DOM Elements
        this.taskForm = document.getElementById('taskForm');
        this.taskInput = document.getElementById('taskInput');
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.formError = document.getElementById('formError');
        this.clearCompleted = document.getElementById('clearCompleted');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        
        // Stats elements
        this.totalTasksEl = document.getElementById('totalTasks');
        this.completedTasksEl = document.getElementById('completedTasks');
        this.pendingTasksEl = document.getElementById('pendingTasks');
        
        // State
        this.tasks = [];
        this.currentFilter = 'all';
        this.taskIdCounter = 0;
        this.openMenuId = null;
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the application
     */
    init() {
        this.loadTasksFromStorage();
        this.attachEventListeners();
        this.render();
    }
    
    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Form submission
        this.taskForm.addEventListener('submit', (e) => this.handleAddTask(e));
        
        // Clear completed tasks
        this.clearCompleted.addEventListener('click', () => this.handleClearCompleted());
        
        // Filter buttons
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilterChange(e));
        });
        
        // Allow Enter key in input
        this.taskInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.taskInput.value.trim()) {
                this.taskForm.dispatchEvent(new Event('submit'));
            }
        });
        
        // Close menu on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.task-btn-options') && !e.target.closest('.options-menu')) {
                this.closeAllMenus();
            }
        });
    }
    
    /**
     * Handle adding a new task
     */
    handleAddTask(e) {
        e.preventDefault();
        
        const taskText = this.taskInput.value.trim();
        
        // Validation
        if (!taskText) {
            this.showError('Please enter a task description');
            return;
        }
        
        if (taskText.length > 150) {
            this.showError('Task description must be less than 150 characters');
            return;
        }
        
        // Check for duplicate
        if (this.tasks.some(t => t.text.toLowerCase() === taskText.toLowerCase())) {
            this.showError('This task already exists');
            return;
        }
        
        // Clear error
        this.clearError();
        
        // Add task
        const task = {
            id: this.generateTaskId(),
            text: taskText,
            completed: false,
            priority: 'normal',
            createdAt: new Date().toISOString()
        };
        
        this.tasks.push(task);
        this.saveTasksToStorage();
        this.taskInput.value = '';
        this.taskInput.focus();
        this.render();
    }
    
    /**
     * Handle task completion toggle
     */
    handleToggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasksToStorage();
            this.render();
        }
    }
    
    /**
     * Handle task deletion
     */
    handleDeleteTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveTasksToStorage();
            this.render();
        }
    }
    
    /**
     * Handle task duplication
     */
    handleDuplicateTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            const newTask = {
                id: this.generateTaskId(),
                text: `${task.text} (copy)`,
                completed: false,
                priority: task.priority,
                createdAt: new Date().toISOString()
            };
            this.tasks.push(newTask);
            this.saveTasksToStorage();
            this.render();
            this.showSuccess('Task duplicated successfully');
        }
    }
    
    /**
     * Handle priority change
     */
    handleChangePriority(taskId, priority) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.priority = priority;
            this.saveTasksToStorage();
            this.render();
        }
    }
    
    /**
     * Handle filter change
     */
    handleFilterChange(e) {
        const filter = e.target.dataset.filter;
        this.currentFilter = filter;
        
        // Update button states
        this.filterButtons.forEach(btn => {
            const isActive = btn.dataset.filter === filter;
            btn.classList.toggle('filter-btn--active', isActive);
            btn.setAttribute('aria-pressed', isActive);
        });
        
        this.render();
    }
    
    /**
     * Handle clear completed tasks
     */
    handleClearCompleted() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        
        if (completedCount === 0) {
            this.showError('No completed tasks to clear');
            return;
        }
        
        if (confirm(`Are you sure you want to delete ${completedCount} completed task(s)?`)) {
            this.tasks = this.tasks.filter(t => !t.completed);
            this.saveTasksToStorage();
            this.render();
            this.showSuccess(`${completedCount} task(s) deleted`);
        }
    }
    
    /**
     * Toggle options menu
     */
    toggleOptionsMenu(taskId, event) {
        event.stopPropagation();
        
        if (this.openMenuId === taskId) {
            this.closeAllMenus();
        } else {
            this.closeAllMenus();
            const btn = event.currentTarget;
            btn.classList.add('active');
            this.openMenuId = taskId;
        }
    }
    
    /**
     * Close all menus
     */
    closeAllMenus() {
        document.querySelectorAll('.task-btn-options.active').forEach(btn => {
            btn.classList.remove('active');
        });
        this.openMenuId = null;
    }
    
    /**
     * Get filtered tasks based on current filter
     */
    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'completed':
                return this.tasks.filter(t => t.completed);
            case 'active':
                return this.tasks.filter(t => !t.completed);
            case 'all':
            default:
                return this.tasks;
        }
    }
    
    /**
     * Update task statistics
     */
    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        
        this.animateStatChange(this.totalTasksEl, total);
        this.animateStatChange(this.completedTasksEl, completed);
        this.animateStatChange(this.pendingTasksEl, pending);
    }
    
    /**
     * Animate stat change
     */
    animateStatChange(element, newValue) {
        const oldValue = parseInt(element.textContent);
        if (oldValue !== newValue) {
            element.style.transform = 'scale(1.2)';
            setTimeout(() => {
                element.textContent = newValue;
                element.style.transform = 'scale(1)';
            }, 100);
        } else {
            element.textContent = newValue;
        }
    }
    
    /**
     * Get priority icon
     */
    getPriorityIcon(priority) {
        const icons = {
            high: '🔴',
            normal: '🟡',
            low: '🟢'
        };
        return icons[priority] || icons.normal;
    }
    
    /**
     * Render the task list
     */
    render() {
        const filteredTasks = this.getFilteredTasks();
        
        // Clear task list
        this.taskList.innerHTML = '';
        
        // Show/hide empty state
        if (filteredTasks.length === 0) {
            this.emptyState.classList.remove('hidden');
        } else {
            this.emptyState.classList.add('hidden');
            filteredTasks.forEach(task => {
                const taskElement = this.createTaskElement(task);
                this.taskList.appendChild(taskElement);
            });
        }
        
        // Update statistics
        this.updateStats();
    }
    
    /**
     * Create a task element
     */
    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.setAttribute('role', 'listitem');
        li.setAttribute('data-task-id', task.id);
        
        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;
        checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`);
        checkbox.addEventListener('change', () => this.handleToggleTask(task.id));
        
        // Task text
        const span = document.createElement('span');
        span.className = 'task-text';
        span.textContent = task.text;
        span.setAttribute('title', task.text);
        
        // Task actions container
        const actions = document.createElement('div');
        actions.className = 'task-actions';
        
        // Options button
        const optionsBtn = document.createElement('button');
        optionsBtn.className = 'task-btn task-btn-options';
        optionsBtn.setAttribute('aria-label', `Options for task: ${task.text}`);
        optionsBtn.innerHTML = '⋮';
        optionsBtn.addEventListener('click', (e) => this.toggleOptionsMenu(task.id, e));
        
        // Options menu
        const optionsMenu = document.createElement('div');
        optionsMenu.className = 'options-menu';
        
        // Priority options
        const priorityHigh = document.createElement('button');
        priorityHigh.className = `options-menu-item ${task.priority === 'high' ? 'active' : ''}`;
        priorityHigh.innerHTML = '🔴 High Priority';
        priorityHigh.addEventListener('click', () => {
            this.handleChangePriority(task.id, 'high');
            this.closeAllMenus();
        });
        
        const priorityNormal = document.createElement('button');
        priorityNormal.className = `options-menu-item ${task.priority === 'normal' ? 'active' : ''}`;
        priorityNormal.innerHTML = '🟡 Normal Priority';
        priorityNormal.addEventListener('click', () => {
            this.handleChangePriority(task.id, 'normal');
            this.closeAllMenus();
        });
        
        const priorityLow = document.createElement('button');
        priorityLow.className = `options-menu-item ${task.priority === 'low' ? 'active' : ''}`;
        priorityLow.innerHTML = '🟢 Low Priority';
        priorityLow.addEventListener('click', () => {
            this.handleChangePriority(task.id, 'low');
            this.closeAllMenus();
        });
        
        // Duplicate option
        const duplicateBtn = document.createElement('button');
        duplicateBtn.className = 'options-menu-item';
        duplicateBtn.innerHTML = '📋 Duplicate';
        duplicateBtn.addEventListener('click', () => {
            this.handleDuplicateTask(task.id);
            this.closeAllMenus();
        });
        
        // Delete option
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'options-menu-item danger';
        deleteBtn.innerHTML = '🗑️ Delete';
        deleteBtn.addEventListener('click', () => {
            if (confirm(`Delete task: "${task.text}"?`)) {
                this.handleDeleteTask(task.id);
            }
            this.closeAllMenus();
        });
        
        optionsMenu.appendChild(priorityHigh);
        optionsMenu.appendChild(priorityNormal);
        optionsMenu.appendChild(priorityLow);
        optionsMenu.appendChild(duplicateBtn);
        optionsMenu.appendChild(deleteBtn);
        
        optionsBtn.appendChild(optionsMenu);
        
        // Priority badge
        const priorityBadge = document.createElement('span');
        priorityBadge.className = 'priority-badge';
        priorityBadge.textContent = this.getPriorityIcon(task.priority);
        priorityBadge.setAttribute('title', `${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} priority`);
        priorityBadge.style.marginRight = '0.5rem';
        
        actions.appendChild(priorityBadge);
        actions.appendChild(optionsBtn);
        
        // Append elements
        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(actions);
        
        return li;
    }
    
    /**
     * Show error message
     */
    showError(message) {
        this.formError.textContent = message;
        this.formError.classList.add('active');
        
        // Auto-hide error after 4 seconds
        setTimeout(() => this.clearError(), 4000);
    }
    
    /**
     * Show success message
     */
    showSuccess(message) {
        const originalHtml = this.formError.innerHTML;
        const originalClass = this.formError.className;
        
        this.formError.textContent = '✓ ' + message;
        this.formError.className = 'form-error active';
        this.formError.style.backgroundColor = 'var(--color-success-light)';
        this.formError.style.color = 'var(--color-success)';
        
        setTimeout(() => {
            this.formError.className = originalClass;
            this.formError.innerHTML = originalHtml;
        }, 3000);
    }
    
    /**
     * Clear error message
     */
    clearError() {
        this.formError.classList.remove('active');
        this.formError.textContent = '';
        this.formError.style.backgroundColor = 'var(--color-error-light)';
        this.formError.style.color = 'var(--color-error)';
    }
    
    /**
     * Generate unique task ID
     */
    generateTaskId() {
        return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Save tasks to localStorage
     */
    saveTasksToStorage() {
        try {
            localStorage.setItem('tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Failed to save tasks to localStorage:', error);
            this.showError('Failed to save tasks. Storage may be full.');
        }
    }
    
    /**
     * Load tasks from localStorage
     */
    loadTasksFromStorage() {
        try {
            const stored = localStorage.getItem('tasks');
            if (stored) {
                this.tasks = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load tasks from localStorage:', error);
            this.tasks = [];
        }
    }
}

// ============================================
// INITIALIZE APPLICATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});

// ============================================
// SERVICE WORKER REGISTRATION (Optional)
// ============================================

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => {
        console.log('ServiceWorker registration failed:', err);
    });
}
