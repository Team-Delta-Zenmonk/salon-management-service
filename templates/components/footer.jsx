import React from "react";
import { Section, Text } from "@react-email/components";
import styles from "../email.styles";

export function Footer({ footerTitle, footerBody }) {
  return (
    <Section style={styles.footerSection}>
      {footerTitle && (
        <Text style={styles.footerTitle}>
          {footerTitle}
        </Text>
      )}
      {footerBody && (
        <Text style={styles.footerBody}>
          {footerBody}
        </Text>
      )}
    </Section>
  );
}

export default Footer;

