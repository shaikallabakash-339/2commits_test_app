import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Users, Briefcase, Target, MessageSquare, Shield, Zap,
  Globe, Award, CheckCircle, Star, TrendingUp, Rocket
} from 'lucide-react';
import Footer from '../components/Footer';
import '../styles/home.css';

function Home() {
  const navigate = useNavigate();
  const [emailInput, setEmailInput] = useState('');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  };

  const features = [
    {
      icon: MessageSquare,
      title: 'Real-Time Messaging',
      description: 'Connect instantly with professionals and build meaningful conversations in real-time.',
      color: '#4f46e5',
    },
    {
      icon: Users,
      title: 'Professional Network',
      description: 'Expand your network with verified professionals across industries and geographies.',
      color: '#ec4899',
    },
    {
      icon: Briefcase,
      title: 'Career Opportunities',
      description: 'Discover job openings, internships, and projects from leading companies.',
      color: '#10b981',
    },
    {
      icon: Shield,
      title: 'Secure & Verified',
      description: 'Safe networking environment with verified profiles and data protection.',
      color: '#f59e0b',
    },
    {
      icon: Zap,
      title: 'Premium Features',
      description: 'Unlock advanced features with our premium membership for maximum reach.',
      color: '#8b5cf6',
    },
    {
      icon: Globe,
      title: 'Global Community',
      description: 'Connect with professionals worldwide and expand your opportunities globally.',
      color: '#06b6d4',
    },
  ];

  const stats = [
    { number: '100K+', label: 'Active Members', icon: Users },
    { number: '5K+', label: 'Companies', icon: Briefcase },
    { number: '500K+', label: 'Connections Made', icon: Globe },
    { number: '98%', label: 'Satisfaction Rate', icon: Star },
  ];

  const testimonials = [
    {
      name: 'Arun Kumar',
      role: 'Software Engineer at Google',
      image: 'https://via.placeholder.com/80?text=AK',
      text: 'Skill Connect helped me transition from a junior developer to a senior role. The networking opportunities are incredible!',
      rating: 5,
    },
    {
      name: 'Priya Sharma',
      role: 'Product Manager at Amazon',
      image: 'https://via.placeholder.com/80?text=PS',
      text: 'I found my current job through Skill Connect and made amazing professional friends. Highly recommend!',
      rating: 5,
    },
    {
      name: 'Raj Patel',
      role: 'Founder, TechStartup',
      image: 'https://via.placeholder.com/80?text=RP',
      text: 'Great platform to connect with talented professionals. Built my entire team through this platform!',
      rating: 5,
    },
  ];

  const pricingPlans = [
    {
      name: 'Free',
      price: '₹0',
      description: 'Perfect to get started',
      features: [
        '5 Conversations limit',
        'Basic profile',
        'Search professionals',
        'Receive messages',
        'Resume upload',
      ],
      cta: 'Get Started',
      action: () => navigate('/signup'),
    },
    {
      name: 'Premium Monthly',
      price: '₹100',
      description: 'Best for active networkers',
      features: [
        'Unlimited conversations',
        'Featured profile',
        'Advanced search',
        'Priority support',
        '10GB storage',
        'Message anyone',
      ],
      cta: 'Start Free Trial',
      popular: true,
      action: () => navigate('/premium'),
    },
    {
      name: 'Premium Yearly',
      price: '₹1000',
      description: 'Best value (Save 17%)',
      features: [
        'All Premium features',
        'Extra file storage',
        'Annual badge',
        'Priority support',
        'Early access',
        'Exclusive events',
      ],
      cta: 'Get Yearly Plan',
      action: () => navigate('/premium'),
    },
  ];

  return (
    <motion.div
      className="home-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero Section */}
      <motion.section
        className="hero-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="hero-content">
          <motion.div
            className="hero-text"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="hero-badge" variants={itemVariants}>
              <Rocket size={16} />
              <span>Professional Networking Reimagined</span>
            </motion.div>

            <motion.h1 className="hero-title" variants={itemVariants}>
              Connect With Professionals
              <br />
              <span className="gradient-text">Build Your Future</span>
            </motion.h1>

            <motion.p className="hero-description" variants={itemVariants}>
              Join a thriving community of 100K+ professionals. Share opportunities, grow together,
              and unlock your potential on India's fastest-growing professional network.
            </motion.p>

            <motion.div className="hero-buttons" variants={itemVariants}>
              <motion.button
                className="btn-primary-large"
                onClick={() => navigate('/signup')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started Free
                <ArrowRight size={18} />
              </motion.button>
              <motion.button
                className="btn-secondary-large"
                onClick={() => navigate('/login')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign In
              </motion.button>
            </motion.div>

            <motion.p className="hero-note" variants={itemVariants}>
              ✓ Free to join • ✓ No credit card required • ✓ Verified profiles
            </motion.p>
          </motion.div>

          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <div className="hero-image">
              <img src="https://via.placeholder.com/500?text=Professional+Network" alt="Networking" />
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        className="stats-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="stats-container">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              className="stat-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="stat-icon">
                <stat.icon size={32} />
              </div>
              <p className="stat-number">{stat.number}</p>
              <p className="stat-label">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="features-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2>Powerful Features</h2>
          <p>Everything you need to succeed in your professional journey</p>
        </motion.div>

        <motion.div
          className="features-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              className="feature-card"
              variants={itemVariants}
              whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
            >
              <div className="feature-icon" style={{ backgroundColor: `${feature.color}20`, color: feature.color }}>
                <feature.icon size={28} />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* How It Works Section */}
      <motion.section
        className="how-it-works"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2>How It Works</h2>
          <p>Get started in three simple steps</p>
        </motion.div>

        <div className="steps-container">
          {[
            {
              number: 1,
              title: 'Create Your Profile',
              description: 'Sign up and build your professional profile with your experience and skills.',
            },
            {
              number: 2,
              title: 'Browse & Connect',
              description: 'Discover professionals in your field and send them a message directly.',
            },
            {
              number: 3,
              title: 'Grow & Succeed',
              description: 'Build relationships, share opportunities, and accelerate your career growth.',
            },
          ].map((step, idx) => (
            <motion.div
              key={idx}
              className="step-card"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="step-number">{step.number}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              {idx < 2 && <ArrowRight className="step-arrow" size={24} />}
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section
        className="testimonials-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2>What Professionals Say</h2>
          <p>Join thousands of happy members</p>
        </motion.div>

        <motion.div
          className="testimonials-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={idx}
              className="testimonial-card"
              variants={itemVariants}
              whileHover={{ y: -5 }}
            >
              <div className="testimonial-header">
                <img src={testimonial.image} alt={testimonial.name} className="testimonial-avatar" />
                <div>
                  <h4>{testimonial.name}</h4>
                  <p className="testimonial-role">{testimonial.role}</p>
                </div>
              </div>
              <p className="testimonial-text">"{testimonial.text}"</p>
              <div className="testimonial-rating">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" color="#fbbf24" />
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Pricing Section */}
      <motion.section
        className="pricing-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2>Simple, Transparent Pricing</h2>
          <p>Choose the perfect plan for you</p>
        </motion.div>

        <motion.div
          className="pricing-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {pricingPlans.map((plan, idx) => (
            <motion.div
              key={idx}
              className={`pricing-card ${plan.popular ? 'popular' : ''}`}
              variants={itemVariants}
              whileHover={{ y: -10 }}
            >
              {plan.popular && (
                <div className="popular-badge">
                  <Zap size={16} />
                  Most Popular
                </div>
              )}
              <h3>{plan.name}</h3>
              <p className="price">{plan.price}</p>
              <p className="price-desc">{plan.description}</p>

              <ul className="features-list">
                {plan.features.map((feature, i) => (
                  <li key={i}>
                    <CheckCircle size={16} />
                    {feature}
                  </li>
                ))}
              </ul>

              <motion.button
                className={`pricing-btn ${plan.popular ? 'primary' : 'secondary'}`}
                onClick={plan.action}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {plan.cta}
              </motion.button>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="cta-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2>Ready to Start Your Journey?</h2>
          <p>Join our community of professionals and grow your network today</p>
          <motion.button
            className="btn-primary-large"
            onClick={() => navigate('/signup')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Get Started Now
            <ArrowRight size={18} />
          </motion.button>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <Footer />
    </motion.div>
  );
}

export default Home;
