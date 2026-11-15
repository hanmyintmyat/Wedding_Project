import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import VenueSection from '../components/invitation/VenueSection';
import type { WeddingData } from '../lib/invitation';
import { weddingConfig } from '../config/wedding.config';
import { CALI_VENUE_EMBED_URL, venueEmbedUrl } from '../lib/venue-embed';

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

test('the venue renders the supplied interactive share embed without API configuration', () => {
  const html = renderToStaticMarkup(createElement(VenueSection, { data }));
  assert.match(html, /aria-label="Wedding venue map"/);
  assert.match(html, /h-\[300px\].*md:h-\[350px\].*lg:h-\[400px\]/);
  assert.match(html, /CALI @ Ascott Raffles Place/);
  assert.ok(html.includes(`src="${CALI_VENUE_EMBED_URL}"`));
  assert.match(html, /<iframe title="Map of CALI @ Ascott Raffles Place"/);
  assert.match(html, /allowFullScreen="" loading="lazy" referrerPolicy="strict-origin-when-cross-origin"/i);
  assert.match(html, /https:\/\/www.google.com\/maps\/search\/\?api=1&amp;query=1.2822%2C103.8513/);
  assert.match(html, /https:\/\/www.google.com\/maps\/dir\/\?api=1&amp;destination=1.2822%2C103.8513/);
  assert.match(html, /target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /Copy Address/);
  assert.match(html, /Add to Calendar/);
  assert.doesNotMatch(html, /output=embed|ERR_BLOCKED_BY_RESPONSE|Open in Browser|maps\/api\/js/);
});

test('missing configuration still shows a venue card and never emits empty navigation links', () => {
  const missing = { ...data, settings: { ...data.settings, venueName: '', venueAddress: '', latitude: NaN, longitude: Infinity } };
  const html = renderToStaticMarkup(createElement(VenueSection, { data: missing }));
  assert.match(html, /Wedding venue/);
  assert.match(html, /Venue details will be shared soon/);
  assert.match(html, /Copy Address/);
  assert.doesNotMatch(html, /<iframe\b|href=""|maps\/search|maps\/dir/);
});

test('the supplied venue address keeps its map and navigation when coordinates are absent', () => {
  const fallback = { ...data, settings: { ...data.settings, venueName: '', latitude: null, longitude: null } };
  const html = renderToStaticMarkup(createElement(VenueSection, { data: fallback }));
  assert.match(html, /maps\/search/);
  assert.match(html, /2%20Finlayson%20Green%2C%20Level%202%2C%20Singapore%20049247/);
  assert.match(html, /Copy Address/);
  assert.ok(html.includes(`src="${CALI_VENUE_EMBED_URL}"`));
  assert.doesNotMatch(html, /output=embed/);
});

test('manual embed exactly matches the provided URL, with no key or short-link dependency', () => {
  assert.equal(CALI_VENUE_EMBED_URL, 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1994.409938243403!2d103.85223296667175!3d1.2818344870148626!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31da19e3709e7593%3A0xe4de1fd725975dcf!2sCALI%20Raffles%20Place%20Restaurant!5e0!3m2!1sen!2sth!4v1794740253103!5m2!1sen!2sth');
  assert.equal(new URL(CALI_VENUE_EMBED_URL).pathname, '/maps/embed');
  assert.ok(new URL(CALI_VENUE_EMBED_URL).searchParams.has('pb'));
  assert.equal(new URL(CALI_VENUE_EMBED_URL).searchParams.has('key'), false);
});

test('changing the admin-configured venue never displays the old manual venue map', () => {
  const changed = { ...data, settings: { ...data.settings, venueName: 'New venue', venueAddress: 'Another address', latitude: 1.4, longitude: 103.9 } };
  const html = renderToStaticMarkup(createElement(VenueSection, { data: changed }));
  assert.match(html, /New venue/);
  assert.match(html, /Another address/);
  assert.match(html, /View Wedding Venue/);
  assert.match(html, /query=1.4%2C103.9/);
  assert.doesNotMatch(html, /<iframe\b|CALI/);
  assert.equal(venueEmbedUrl({ latitude: NaN, longitude: Infinity, venueAddress: weddingConfig.address }), null);
  assert.equal(venueEmbedUrl({ latitude: 1.2822, longitude: null, venueAddress: weddingConfig.address }), null);
});
