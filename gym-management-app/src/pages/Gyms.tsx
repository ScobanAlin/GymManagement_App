import React from "react";
import GymsPage from "../components/gyms-components/GymsPage";

/**
 * Wrapper page for the Gyms feature.
 * Keeps routing clean and delegates all logic/UI to GymPage.
 */
export default function Gyms() {
    return <GymsPage />;
}