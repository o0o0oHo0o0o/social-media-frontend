import React from 'react';
import '../../styles/button.css';
import { Loader } from 'lucide-react';

const Button = ({ children, loading, loadingText, variant = 'primary', size = 'md', ...props }) => (
  <button className={`btn btn-${variant} btn-${size} ${loading ? 'is-busy' : ''}`} disabled={loading} aria-busy={loading} {...props}>
    {loading ? (
      <>
        <Loader className="spin" size={20} />
        <span>{loadingText || children}</span>
      </>
    ) : (
      children
    )}
  </button>
);

export default Button;