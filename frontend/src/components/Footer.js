import React from 'react';
import { Link } from 'react-router-dom';
import { Linkedin, Facebook, Twitter, Instagram, Mail, Phone, MapPin, Sparkles, ArrowUpRight } from 'lucide-react';
import '../styles/footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: 'Platform',
      links: [
        { label: 'Home', to: '/' },
        { label: 'Dashboard', to: '#' },
        { label: 'Browse Professionals', to: '#' },
        { label: 'Opportunities', to: '#' },
      ],
    },
    {
      title: 'Community',
      links: [
        { label: 'Donate to Homes', to: '/old-age-homes' },
        { label: 'Donate to Orphans', to: '/orphans' },
        { label: 'Events', to: '#' },
        { label: 'Blog', to: '#' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', to: '#' },
        { label: 'Contact', to: '#' },
        { label: 'Privacy Policy', to: '#' },
        { label: 'Terms of Service', to: '#' },
      ],
    },
  ];

  const socialLinks = [
    { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
    { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <footer>
      {/* Top Section */}
      <div className="footer-top">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <div className="footer-logo-icon">
                <Sparkles size={24} />
              </div>
              <div className="footer-logo-text">
                <h3>Skill Connect</h3>
                <p>Professional Network</p>
              </div>
            </Link>
            <p className="footer-description">
              Connect with professionals, grow your skills, and build meaningful relationships in your field.
            </p>

            {/* Contact Info */}
            <div className="footer-contact">
              <a href="mailto:contact@skillconnect.com" className="contact-item">
                <Mail size={18} />
                <span>contact@skillconnect.com</span>
              </a>
              <a href="tel:+1234567890" className="contact-item">
                <Phone size={18} />
                <span>+1 (234) 567-890</span>
              </a>
              <div className="contact-item">
                <MapPin size={18} />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </div>

          {/* Links */}
          {footerLinks.map((section, index) => (
            <div key={index} className="footer-section">
              <h3>{section.title}</h3>
              <div className="footer-links">
                {section.links.map((link, linkIndex) => (
                  <Link key={linkIndex} to={link.to} className="footer-link">
                    {link.label}
                    <ArrowUpRight size={14} />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="footer-divider"></div>

        {/* Bottom Section */}
        <div className="footer-bottom">
          {/* Copyright */}
          <div className="footer-copyright">
            <p>
              &copy; {currentYear} Skill Connect. All rights reserved. | Built with{' '}
              <span className="heart">❤️</span>
            </p>
          </div>

          {/* Social Links */}
          <div className="footer-social">
            {socialLinks.map((social, index) => {
              const IconComponent = social.icon;
              return (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="social-link"
                >
                  <IconComponent size={20} />
                </a>
              );
            })}
          </div>

          {/* CTA Button */}
          <Link to="/login" className="footer-cta">
            Get Started
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>

      {/* Gradient Accent */}
      <div className="footer-accent"></div>
    </footer>
  );
}

export default Footer;
