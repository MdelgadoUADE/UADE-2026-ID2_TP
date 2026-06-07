<template>
  <div 
    v-if="trustScore !== null && trustScore !== undefined"
    class="trust-score-badge"
    :class="trustClass"
    :title="tooltipText"
  >
    <svg 
      class="trust-icon" 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="currentColor"
    >
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
    </svg>
    <span class="trust-label">{{ trustLabel }}</span>
    <span class="trust-score">{{ formattedScore }}</span>
  </div>
</template>

<script>
export default {
  name: 'TrustScoreBadge',
  
  props: {
    trustScore: {
      type: Number,
      default: null
    },
    showLabel: {
      type: Boolean,
      default: true
    },
    size: {
      type: String,
      default: 'medium', // 'small', 'medium', 'large'
      validator: (value) => ['small', 'medium', 'large'].includes(value)
    }
  },
  
  computed: {
    trustClass() {
      const sizeClass = `trust-${this.size}`;
      
      if (this.trustScore >= 0.8) return `trust-high ${sizeClass}`;
      if (this.trustScore >= 0.6) return `trust-medium ${sizeClass}`;
      if (this.trustScore >= 0.4) return `trust-low ${sizeClass}`;
      return `trust-very-low ${sizeClass}`;
    },
    
    trustLabel() {
      if (!this.showLabel) return '';
      
      if (this.trustScore >= 0.8) return 'Alta';
      if (this.trustScore >= 0.6) return 'Media';
      if (this.trustScore >= 0.4) return 'Baja';
      return 'Muy baja';
    },
    
    formattedScore() {
      return Math.floor(this.trustScore * 100) + '%';
    },
    
    tooltipText() {
      const level = this.trustScore >= 0.8 ? 'Alta confianza' :
                    this.trustScore >= 0.6 ? 'Confianza media' :
                    this.trustScore >= 0.4 ? 'Baja confianza' :
                    'Muy baja confianza';
      
      return `${level} - Trust Score: ${this.formattedScore}`;
    }
  }
}
</script>

<style scoped>
.trust-score-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  border-radius: 0.375rem;
  font-weight: 600;
  font-size: 0.75rem;
  line-height: 1rem;
  transition: all 0.2s;
  cursor: help;
}

.trust-score-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Tamaños */
.trust-small {
  padding: 0.125rem 0.375rem;
  font-size: 0.625rem;
  gap: 0.25rem;
}

.trust-small .trust-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.trust-medium {
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  gap: 0.375rem;
}

.trust-medium .trust-icon {
  width: 1rem;
  height: 1rem;
}

.trust-large {
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
  gap: 0.5rem;
}

.trust-large .trust-icon {
  width: 1.25rem;
  height: 1.25rem;
}

/* Niveles de confianza */
.trust-high {
  background-color: #d1fae5;
  color: #065f46;
  border: 1px solid #10b981;
}

.trust-medium {
  background-color: #fef3c7;
  color: #92400e;
  border: 1px solid #f59e0b;
}

.trust-low {
  background-color: #fed7aa;
  color: #9a3412;
  border: 1px solid #f97316;
}

.trust-very-low {
  background-color: #fee2e2;
  color: #991b1b;
  border: 1px solid #ef4444;
}

.trust-icon {
  flex-shrink: 0;
}

.trust-label {
  font-weight: 600;
}

.trust-score {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .trust-high {
    background-color: #064e3b;
    color: #d1fae5;
  }
  
  .trust-medium {
    background-color: #78350f;
    color: #fef3c7;
  }
  
  .trust-low {
    background-color: #7c2d12;
    color: #fed7aa;
  }
  
  .trust-very-low {
    background-color: #7f1d1d;
    color: #fee2e2;
  }
}
</style>