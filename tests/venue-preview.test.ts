import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import VenueSection from '../components/invitation/VenueSection';
import type { WeddingData } from '../lib/invitation';
import { weddingConfig } from '../config/wedding.config';

const data = {
  settings: {
    venueName: weddingConfig.venue,
    venueAddress: weddingConfig.address,
    venueDirections: weddingConfig.venueDirections,
    latitude: weddingConfig.latitude,
    longitude: weddingConfig.longitude,
    weddingDate: weddingConfig.date,
    startTime: weddingConfig.startTime,
    endTime: weddingConfig.endTime,
    groomName: weddingConfig.groom,
    brideName: weddingConfig.bride
  },
  content: { venueHeading: 'Venue', englishIntro: 'Celebrate with us.' }
} as WeddingData;

test('the initial venue HTML contains a preview card and HTTPS actions, never a Google frame', () => {
  const html = renderToStaticMarkup(createElement(VenueSection, { data }));
  assert.match(html, /aria-label="Venue location preview"/);
  assert.match(html, /h-\[320px\].*sm:h-\[400px\]/);
  assert.match(html, /CALI @ Ascott Raffles Place/);
  assert.match(html, /Tap View Location to open the map/);
  assert.match(html, /https:\/\/www.google.com\/maps\/search\/\?api=1&amp;query=1.2822%2C103.8513/);
  assert.match(html, /https:\/\/www.google.com\/maps\/dir\/\?api=1&amp;destination=1.2822%2C103.8513/);
  assert.match(html, /target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /Copy Address/);
  assert.match(html, /Add to Calendar/);
  assert.doesNotMatch(html, /<iframe\b|output=embed|ERR_BLOCKED_BY_RESPONSE|Open in Browser/);
});

test('missing configuration still shows a venue card and never emits empty navigation links', () => {
  const missing = { ...data, settings: { ...data.settings, venueName: '', venueAddress: '', latitude: NaN, longitude: Infinity } };
  const html = renderToStaticMarkup(createElement(VenueSection, { data: missing }));
  assert.match(html, /Wedding venue/);
  assert.match(html, /Venue details will be shared soon/);
  assert.match(html, /Copy Address/);
  assert.doesNotMatch(html, /<iframe\b|href=""|maps\/search|maps\/dir/);
});

test('an address keeps navigation and copy available when coordinates are invalid', () => {
  const fallback = { ...data, settings: { ...data.settings, venueName: '', latitude: null, longitude: null } };
  const html = renderToStaticMarkup(createElement(VenueSection, { data: fallback }));
  assert.match(html, /maps\/search/);
  assert.match(html, /2%20Finlayson%20Green%2C%20Level%202%2C%20Singapore%20049247/);
  assert.match(html, /Copy Address/);
  assert.doesNotMatch(html, /<iframe\b|output=embed/);
});
