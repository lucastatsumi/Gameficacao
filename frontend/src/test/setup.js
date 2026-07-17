import '@testing-library/jest-dom/vitest';
import * as matchersAxe from 'vitest-axe/matchers';
import { expect } from 'vitest';

expect.extend(matchersAxe);
