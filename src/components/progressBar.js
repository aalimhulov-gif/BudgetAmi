// Компонент прогресс-бара
class ProgressBarComponent {
    constructor() {
        this.template = `
            <div class="progress-bar">
                <div class="progress-fill {{statusClass}}" style="width: {{percent}}%"></div>
            </div>
            <div class="progress-text">
                <span>{{leftText}}</span>
                <span>{{rightText}}</span>
            </div>
        `;
    }

    // Создать прогресс-бар
    create(options = {}) {
        const defaultOptions = {
            current: 0,
            target: 100,
            showText: true,
            showPercent: true,
            showValues: false,
            leftText: '',
            rightText: '',
            animated: true,
            color: 'primary'
        };

        const config = { ...defaultOptions, ...options };
        
        const percent = config.target > 0 ? Math.min((config.current / config.target) * 100, 100) : 0;
        const statusClass = this.getStatusClass(percent, config.color);
        
        let leftText = config.leftText;
        let rightText = config.rightText;
        
        if (config.showPercent && !config.leftText) {
            leftText = `${Math.round(percent)}%`;
        }
        
        if (config.showValues && !config.rightText) {
            rightText = `${config.current} / ${config.target}`;
        }
        
        const html = this.template
            .replace('{{percent}}', percent)
            .replace('{{statusClass}}', statusClass)
            .replace('{{leftText}}', leftText)
            .replace('{{rightText}}', rightText);
        
        const container = document.createElement('div');
        container.innerHTML = html;
        const element = container.children[0].parentNode;
        
        // Добавляем анимацию если нужно
        if (config.animated) {
            const progressFill = element.querySelector('.progress-fill');
            progressFill.style.width = '0%';
            progressFill.style.transition = 'width 0.6s ease-in-out';
            
            setTimeout(() => {
                progressFill.style.width = `${percent}%`;
            }, 100);
        }
        
        return element;
    }

    // Обновить прогресс-бар
    update(element, options = {}) {
        const defaultOptions = {
            current: 0,
            target: 100,
            animated: true,
            color: 'primary'
        };

        const config = { ...defaultOptions, ...options };
        const percent = config.target > 0 ? Math.min((config.current / config.target) * 100, 100) : 0;
        const statusClass = this.getStatusClass(percent, config.color);
        
        const progressFill = element.querySelector('.progress-fill');
        const progressText = element.querySelector('.progress-text');
        
        if (progressFill) {
            progressFill.className = `progress-fill ${statusClass}`;
            
            if (config.animated) {
                progressFill.style.transition = 'width 0.6s ease-in-out';
            }
            
            progressFill.style.width = `${percent}%`;
        }
        
        if (progressText && config.showText !== false) {
            const leftSpan = progressText.querySelector('span:first-child');
            const rightSpan = progressText.querySelector('span:last-child');
            
            if (leftSpan && config.showPercent !== false) {
                leftSpan.textContent = `${Math.round(percent)}%`;
            }
            
            if (rightSpan && config.showValues) {
                rightSpan.textContent = `${config.current} / ${config.target}`;
            }
        }
    }

    // Определить класс статуса по проценту
    getStatusClass(percent, color = 'primary') {
        if (color !== 'primary') {
            return color;
        }
        
        if (percent >= 100) {
            return 'success';
        } else if (percent >= 80) {
            return 'warning';
        } else if (percent >= 60) {
            return 'primary';
        } else {
            return 'danger';
        }
    }

    // Создать круговой прогресс-бар
    createCircular(options = {}) {
        const defaultOptions = {
            current: 0,
            target: 100,
            size: 120,
            strokeWidth: 8,
            showPercent: true,
            showValues: false,
            color: 'primary'
        };

        const config = { ...defaultOptions, ...options };
        const percent = config.target > 0 ? Math.min((config.current / config.target) * 100, 100) : 0;
        const radius = (config.size - config.strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const strokeDasharray = circumference;
        const strokeDashoffset = circumference - (percent / 100) * circumference;
        
        const colorClass = this.getStatusClass(percent, config.color);
        const colors = {
            primary: 'var(--primary-color)',
            success: 'var(--success-color)',
            warning: 'var(--warning-color)',
            danger: 'var(--error-color)',
            info: 'var(--info-color)'
        };
        
        const strokeColor = colors[colorClass] || colors.primary;
        
        const html = `
            <div class="circular-progress" style="width: ${config.size}px; height: ${config.size}px; position: relative;">
                <svg width="${config.size}" height="${config.size}" style="transform: rotate(-90deg);">
                    <circle
                        cx="${config.size / 2}"
                        cy="${config.size / 2}"
                        r="${radius}"
                        stroke="var(--border-color)"
                        stroke-width="${config.strokeWidth}"
                        fill="transparent"
                    />
                    <circle
                        cx="${config.size / 2}"
                        cy="${config.size / 2}"
                        r="${radius}"
                        stroke="${strokeColor}"
                        stroke-width="${config.strokeWidth}"
                        fill="transparent"
                        stroke-dasharray="${strokeDasharray}"
                        stroke-dashoffset="${strokeDashoffset}"
                        stroke-linecap="round"
                        style="transition: stroke-dashoffset 0.6s ease-in-out;"
                    />
                </svg>
                <div class="circular-progress-text" style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                    font-weight: bold;
                    color: var(--text-primary);
                ">
                    ${config.showPercent ? `<div style="font-size: 1.2rem;">${Math.round(percent)}%</div>` : ''}
                    ${config.showValues ? `<div style="font-size: 0.8rem; color: var(--text-secondary);">${config.current}/${config.target}</div>` : ''}
                </div>
            </div>
        `;
        
        const container = document.createElement('div');
        container.innerHTML = html;
        return container.firstElementChild;
    }

    // Обновить круговой прогресс-бар
    updateCircular(element, options = {}) {
        const defaultOptions = {
            current: 0,
            target: 100,
            color: 'primary'
        };

        const config = { ...defaultOptions, ...options };
        const percent = config.target > 0 ? Math.min((config.current / config.target) * 100, 100) : 0;
        
        const svg = element.querySelector('svg');
        const progressCircle = svg.querySelector('circle:last-child');
        const textElement = element.querySelector('.circular-progress-text');
        
        if (progressCircle) {
            const radius = parseFloat(progressCircle.getAttribute('r'));
            const circumference = radius * 2 * Math.PI;
            const strokeDashoffset = circumference - (percent / 100) * circumference;
            
            progressCircle.style.strokeDashoffset = strokeDashoffset;
            
            // Обновляем цвет
            const colorClass = this.getStatusClass(percent, config.color);
            const colors = {
                primary: 'var(--primary-color)',
                success: 'var(--success-color)',
                warning: 'var(--warning-color)',
                danger: 'var(--error-color)',
                info: 'var(--info-color)'
            };
            
            progressCircle.setAttribute('stroke', colors[colorClass] || colors.primary);
        }
        
        if (textElement) {
            const percentDiv = textElement.querySelector('div:first-child');
            const valuesDiv = textElement.querySelector('div:last-child');
            
            if (percentDiv) {
                percentDiv.textContent = `${Math.round(percent)}%`;
            }
            
            if (valuesDiv && valuesDiv !== percentDiv) {
                valuesDiv.textContent = `${config.current}/${config.target}`;
            }
        }
    }

    // Создать мини прогресс-бар (для использования в списках)
    createMini(options = {}) {
        const defaultOptions = {
            current: 0,
            target: 100,
            height: 6,
            color: 'primary',
            showPercent: false
        };

        const config = { ...defaultOptions, ...options };
        const percent = config.target > 0 ? Math.min((config.current / config.target) * 100, 100) : 0;
        const statusClass = this.getStatusClass(percent, config.color);
        
        const html = `
            <div class="progress-bar-mini" style="height: ${config.height}px; background: var(--border-color); border-radius: ${config.height / 2}px; overflow: hidden;">
                <div class="progress-fill ${statusClass}" style="width: ${percent}%; height: 100%; transition: width 0.3s ease;"></div>
            </div>
            ${config.showPercent ? `<div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">${Math.round(percent)}%</div>` : ''}
        `;
        
        const container = document.createElement('div');
        container.innerHTML = html;
        return container;
    }

    // Создать анимированный прогресс загрузки
    createLoading(options = {}) {
        const defaultOptions = {
            message: 'Загрузка...',
            color: 'primary'
        };

        const config = { ...defaultOptions, ...options };
        
        const html = `
            <div class="progress-loading">
                <div class="progress-bar" style="height: 4px; background: var(--border-color); border-radius: 2px; overflow: hidden; margin-bottom: 10px;">
                    <div class="progress-fill ${config.color}" style="
                        width: 30%;
                        height: 100%;
                        background: var(--primary-color);
                        animation: progressLoading 1.5s ease-in-out infinite;
                    "></div>
                </div>
                <div style="text-align: center; font-size: 0.9rem; color: var(--text-secondary);">
                    ${config.message}
                </div>
            </div>
            <style>
                @keyframes progressLoading {
                    0% { transform: translateX(-100%); }
                    50% { transform: translateX(0%); }
                    100% { transform: translateX(300%); }
                }
            </style>
        `;
        
        const container = document.createElement('div');
        container.innerHTML = html;
        return container.firstElementChild;
    }

    // Создать прогресс-бар для лимитов расходов
    createLimitBar(spent, limit, options = {}) {
        const defaultOptions = {
            showWarning: true,
            warningThreshold: 0.8, // 80%
            dangerThreshold: 1.0,   // 100%
            currency: 'zł'
        };

        const config = { ...defaultOptions, ...options };
        const percent = limit > 0 ? (spent / limit) * 100 : 0;
        const remaining = Math.max(limit - spent, 0);
        
        let statusClass = 'success';
        let statusText = 'В пределах лимита';
        
        if (percent >= config.dangerThreshold * 100) {
            statusClass = 'danger';
            statusText = 'Лимит превышен!';
        } else if (percent >= config.warningThreshold * 100) {
            statusClass = 'warning';
            statusText = 'Приближение к лимиту';
        }
        
        const html = `
            <div class="limit-progress">
                <div class="progress-bar">
                    <div class="progress-fill ${statusClass}" style="width: ${Math.min(percent, 100)}%"></div>
                </div>
                <div class="progress-text">
                    <span>${Math.round(percent)}%</span>
                    <span>${remaining.toFixed(2)} ${config.currency} осталось</span>
                </div>
                ${config.showWarning && percent >= config.warningThreshold * 100 ? 
                    `<div class="limit-warning" style="color: var(--${statusClass === 'danger' ? 'error' : 'warning'}-color); font-size: 0.8rem; margin-top: 5px;">
                        <i class="fas fa-exclamation-triangle"></i> ${statusText}
                    </div>` : ''}
            </div>
        `;
        
        const container = document.createElement('div');
        container.innerHTML = html;
        return container.firstElementChild;
    }
}

export default new ProgressBarComponent();