/**
 * React Native Web Runtime Resolver
 * 
 * This module provides runtime interception and graceful fallback handling
 * for React Native modules that may not work properly on web platforms.
 * 
 * Unlike build-time resolvers (Metro), this works at runtime to catch
 * method calls that would otherwise crash and provides graceful alternatives.
 */

const { createRuntimeResolver } = require('./runtime-resolver');
const { createProxyWrapper } = require('./proxy-wrapper');
const { PlatformDetector } = require('./platform-detector');
const { FallbackManager } = require('./fallback-manager');

module.exports = {
  createRuntimeResolver,
  createProxyWrapper,
  PlatformDetector,
  FallbackManager
};