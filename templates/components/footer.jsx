import React from "react";
import { Section } from "@react-email/section";
import { Text } from "@react-email/text";
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

