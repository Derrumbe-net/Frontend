import "../styles/Request_module.css";
import educationalTalk from "../assets/educational_talk.webp";
import { useState } from "react";
import { SITE_CONFIG } from "@config";

export default function EducationalTalkRequest() {

  const [agreed, setAgreed] = useState(false);

  const handleCheckboxChange = (e) => {
    setAgreed(e.target.checked);
  };

  const openForm = () => {
    window.open(
      "https://forms.office.com/pages/responsepage.aspx?id=wF36DW8DFUaZ5JSvgi8rhIlImwsjD_VBt9FEUbX9hshUNVI0NjVRSDlVMzZUTUYwTzJMVVRSWFJJMyQlQCN0PWcu&route=shorturl",
      "_blank"
    );
  };

  return (
    <section className="request-page">
      <div className="request__header">
        <div className="request__image-wrapper">
          <img
            src={educationalTalk}
            alt="Charla educativa en escuela"
            className="request__image"
            loading="lazy"
          />
        </div>
        <div className="request__text">
          <h1>{SITE_CONFIG.REQUEST.TITLE}</h1>
          <h2>{SITE_CONFIG.REQUEST.SUBTITLE}</h2>
          <p>
            {SITE_CONFIG.REQUEST.DESCRIPTION}
          </p>
        </div>
      </div>

      <hr className="request__divider" />

      <div className="request__body">
        <h2>{SITE_CONFIG.REQUEST.RULES_TITLE}</h2>

        <h3>{SITE_CONFIG.REQUEST.VIRTUAL_TITLE}</h3>
        <ol>
          {SITE_CONFIG.REQUEST.VIRTUAL_RULES.map((rule, i) => (
            <li key={i}>{rule}</li>
          ))}
        </ol>

        <h3>{SITE_CONFIG.REQUEST.SCHOOL_TITLE}</h3>
        <ol>
          {SITE_CONFIG.REQUEST.SCHOOL_RULES.map((rule, i) => (
            <li key={i}>
              {typeof rule === "string" ? (
                rule
              ) : (
                <>
                  {rule.TEXT}
                  <ul>
                    {rule.ITEMS.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                </>
              )}
            </li>
          ))}
        </ol>

        <h3>{SITE_CONFIG.REQUEST.PUBLIC_TITLE}</h3>
        <ol>
          {SITE_CONFIG.REQUEST.PUBLIC_RULES.map((rule, i) => (
            <li key={i}>{rule}</li>
          ))}
        </ol>

        <label className="request__checkbox">
          <input 
            type="checkbox" 
            checked={agreed} 
            onChange={handleCheckboxChange} 
          />
          {SITE_CONFIG.REQUEST.CHECKBOX_LABEL}
        </label>

        {agreed && (
          <div className="request__button-container">
            <button className="request__form-button" onClick={openForm}>
              {SITE_CONFIG.REQUEST.FORM_BTN}
            </button>
          </div>
        )}

      </div>
    </section>
  );
}