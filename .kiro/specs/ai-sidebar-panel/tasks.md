# Implementation Plan: AI Sidebar Panel

## Overview

Transform the AI assistant from a standalone page into a collapsible sidebar panel integrated with the Skills view, with permission controls, text selection integration, and option-based interactions.

## Tasks

- [x] 1. Create AI Store for state management
  - [x] 1.1 Create `src/stores/ai.ts` with panel state, permissions, and messages
    - Define AiPermissions interface
    - Define Message interface with options support
    - Implement localStorage persistence for permissions and panel state
    - Default all permissions to false
    - _Requirements: 2.4, 2.5, 2.6, 1.6_

  - [ ]* 1.2 Write property test for permission persistence round-trip
    - **Property 3: Permission Persistence Round-Trip**
    - **Validates: Requirements 2.4, 2.5**

- [x] 2. Create Permission Control Component
  - [x] 2.1 Create `src/components/AiPermissionControl.vue`
    - Four toggle switches for: create folder, create file, edit file, delete file
    - Compact horizontal layout
    - Emit permission changes to parent
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 2.2 Add i18n translations for permission labels
    - Add Chinese and English translations
    - _Requirements: 2.2_

- [x] 3. Create AI Sidebar Panel Component
  - [x] 3.1 Create `src/components/AiSidebarPanel.vue`
    - Collapsible panel structure
    - Include permission control at top
    - Chat message area
    - Input area at bottom
    - _Requirements: 1.2, 2.1_

  - [x] 3.2 Implement panel open/close animation
    - Slide in/out from right
    - Smooth transition
    - _Requirements: 1.1, 1.3_

  - [ ]* 3.3 Write property test for panel toggle round-trip
    - **Property 1: Panel Toggle Round-Trip**
    - **Validates: Requirements 1.1, 1.3, 4.3**

- [x] 4. Integrate AI Panel into Skills View
  - [x] 4.1 Update `src/views/SkillsView.vue` layout
    - Add AI panel container on right side
    - Implement responsive width adjustment
    - Add AI toggle button in header
    - _Requirements: 1.4, 1.5, 4.2, 4.3_

  - [x] 4.2 Implement panel state persistence
    - Save open/close state to localStorage
    - Restore state on component mount
    - _Requirements: 1.6_

  - [ ]* 4.3 Write property test for panel state persistence
    - **Property 2: Panel State Persistence Round-Trip**
    - **Validates: Requirements 1.6**

- [x] 5. Checkpoint - Verify basic panel functionality
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement File Operations through AI
  - [x] 6.1 Create file operation handler in AI store
    - Check permissions before executing
    - Call skills store methods for actual operations
    - Return success/failure status
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 6.2 Add operation feedback UI
    - Display success/error notifications in chat
    - Show operation details (file path, action type)
    - _Requirements: 3.5, 3.6_

  - [x] 6.3 Implement auto-refresh after file operations
    - Trigger skills store reload after successful operations
    - _Requirements: 3.7_

  - [ ]* 6.4 Write property test for permission-gated operations
    - **Property 4: Permission-Gated Operations**
    - **Validates: Requirements 2.3, 3.1, 3.2, 3.3, 3.4**

- [x] 7. Create Text Selection Menu
  - [x] 7.1 Create `src/components/TextSelectionMenu.vue`
    - Floating menu near selection
    - "Send to AI" button
    - Position calculation based on selection
    - _Requirements: 6.1, 6.2_

  - [x] 7.2 Integrate selection menu into editor
    - Detect text selection in textarea
    - Show/hide menu based on selection state
    - Handle click outside to dismiss
    - _Requirements: 6.1, 6.6_

  - [x] 7.3 Implement "Send to AI" functionality
    - Open panel if closed
    - Send selected text as context
    - Display prompt for processing options
    - _Requirements: 6.3, 6.4, 6.5_

  - [ ]* 7.4 Write property test for text selection menu behavior
    - **Property 6: Text Selection Menu Visibility**
    - **Validates: Requirements 6.1, 6.6**

- [x] 8. Checkpoint - Verify text selection integration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Create Option Prompt Component
  - [x] 9.1 Create `src/components/AiOptionPrompt.vue`
    - Display clickable option buttons
    - Include "Other" option with text input
    - Support multiple categories
    - _Requirements: 7.1, 7.2, 7.3, 7.6_

  - [x] 9.2 Integrate option prompts into chat flow
    - Render options in assistant messages
    - Handle option selection
    - Continue conversation with selection
    - _Requirements: 7.4, 7.5_

  - [ ]* 9.3 Write property test for option selection flow
    - **Property 8: Option Selection Flow**
    - **Validates: Requirements 7.4, 7.5**

- [x] 10. Update Navigation
  - [x] 10.1 Remove standalone AI page from router
    - Update `src/router/index.ts`
    - Remove AI route
    - _Requirements: 4.1_

  - [x] 10.2 Update sidebar navigation
    - Remove AI link from `AppSidebar.vue`
    - _Requirements: 4.1_

- [x] 11. Implement Responsive Layout
  - [x] 11.1 Add responsive styles for AI panel
    - Overlay mode for screens < 768px
    - Push mode for screens >= 768px
    - Min width 320px, max width 480px
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 12. Final checkpoint - Complete integration testing
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
