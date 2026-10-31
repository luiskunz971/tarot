"use client";

import { useState } from "react";
import { cardImage, type DrawnCard } from "@/lib/cards";
import styles from "./TarotCard.module.css";

type Props = {
  card?: DrawnCard;
  revealed: boolean;
  size?: "sm" | "md" | "lg";
};

export default function TarotCard({ card, revealed, size = "lg" }: Props) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className={`${styles.card} ${styles[size]} ${revealed ? styles.flipped : ""}`}>
      <div className={styles.inner}>
        <div className={styles.back} aria-hidden={revealed}>
          <div className={styles.backPattern}>
            <span>☾</span>
            <span className={styles.backStar}>✦</span>
            <span>☽</span>
          </div>
        </div>
        {card && (
          <div className={styles.front} aria-hidden={!revealed}>
            {imageFailed ? (
              <div className={`${styles.face} ${card.reversed ? styles.reversed : ""}`}>
                <span className={styles.numeral}>{card.numeral}</span>
                <span className={styles.symbol}>{card.symbol}</span>
                <span className={styles.name}>{card.name}</span>
              </div>
            ) : (
              <div className={`${styles.illustrated} ${card.reversed ? styles.reversed : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cardImage(card.id)}
                  alt={card.name}
                  className={styles.art}
                  onError={() => setImageFailed(true)}
                />
                <span className={styles.banner}>
                  <span className={styles.bannerNumeral}>{card.numeral}</span>
                  {card.name}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
