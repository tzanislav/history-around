import React from 'react';
import '../CSS/Contacts.css';

const Contacts: React.FC = () => {
    return (
        <div className="contacts-container">
            <h1 className="contacts-title">Contact Us</h1>
            <div className="contacts-content">
                <div className="contact-info">
                    <h3>Свържете се с нас</h3>
                    <p>Ще се радваме да чуем от вас! Свържете се с нас за всякакви въпроси, предложения или обратна връзка.</p>
                </div>
                
                <div className="contact-methods">
                    <div className="contact-item">
                        <h4>Email</h4>
                        <p>info@historyaround.com</p>
                    </div>
                    
                    <div className="contact-item">
                        <h4>Телефон</h4>
                        <p>+359 (887) 618-814</p>
                    </div>
                    
                    <div className="contact-item">
                        <h4>Адрес</h4>
                        <p>Стара Загора<br />ул. Развитие 40</p>
                    </div>
                </div>
                
                <div className="contact-form">
                    <h3>Изпратете ни съобщение</h3>
                    <form>
                        <input type="text" placeholder="Вашето име" className="form-input" />
                        <input type="email" placeholder="Вашият имейл" className="form-input" />
                        <textarea placeholder="Вашето съобщение" className="form-textarea" rows={5}></textarea>
                        <button type="submit" className="form-button">Изпратете съобщение</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Contacts;