import React from 'react';
import './ServicesSection.css';

const ServicesSection = () => {
    const services = [
        { id: '01', title: 'Service One', description: 'Description of service one.' },
        { id: '02', title: 'Service Two', description: 'Description of service two.' },
        { id: '03', title: 'Service Three', description: 'Description of service three.' },
        { id: '04', title: 'Service Four', description: 'Description of service four.' },
    ];

    return (
        <section className="services-section">
            <h2>Our Services</h2>
            <div className="services-container">
                {services.map(service => (
                    <div key={service.id} className="service-card">
                        <span className="badge">{service.id}</span>
                        <h3>{service.title}</h3>
                        <p>{service.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default ServicesSection;