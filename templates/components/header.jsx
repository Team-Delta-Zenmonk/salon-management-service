import React from "react";
import { Section, Text, Img } from "@react-email/components";
import styles from "../email.styles";

export function Header({ title }) {
  const displayBrand = process.env.BRAND_NAME || "Vellora";
  const baseUrl = process.env.BACKEND_URL || "";
  const displayLogo =`${baseUrl}/static/logo.png`;

  return (
    <>
      <Section style={styles.logoSection}>
        <table cellPadding="0" cellSpacing="0" border="0">
          <tr>
            {displayLogo && (
              <td style={{ verticalAlign: "middle", paddingRight: "12px" }}>
                <Img
                  src={displayLogo}
                  alt={displayBrand}
                  width="36"
                  height="36"
                  style={{
                    display: "block",
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    objectFit: "contain",
                  }}
                />
              </td>
            )}
            <td style={{ verticalAlign: "middle" }}>
              <span style={styles.headerBrandText}>
                {displayBrand}
              </span>
            </td>
          </tr>
        </table>
      </Section>

      <Section style={styles.bannerSection}>
        <Text style={styles.bannerTitle}>
          {title}
        </Text>
      </Section>
    </>
  );
}

export default Header;

