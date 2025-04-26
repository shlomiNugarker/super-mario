import KeyboardState from '../KeyboardState';
import InputRouter from '../InputRouter';
import { Vec2 } from '../math';
import { InputEvent, InputEventTypes, InputReceiver } from '../../types/input';

type KeyState = 0 | 1;
const PRESSED = 1 as KeyState;
const RELEASED = 0 as KeyState;

/**
 * Custom input event class implementing InputEvent interface
 */
class GameInputEvent implements InputEvent {
  name: symbol;
  type: symbol;
  action: string;
  keyState?: KeyState;
  direction?: number;
  [key: string]: unknown;

  constructor(
    action: string,
    stateOrOptions?: KeyState | { direction?: number; keyState?: KeyState }
  ) {
    this.action = action;
    this.name = Symbol(action);
    this.type = InputEventTypes.PRESS;

    if (stateOrOptions !== undefined) {
      if (typeof stateOrOptions === 'number') {
        this.keyState = stateOrOptions;
        this.type = stateOrOptions === PRESSED ? InputEventTypes.PRESS : InputEventTypes.RELEASE;
      } else {
        if (stateOrOptions.keyState !== undefined) {
          this.keyState = stateOrOptions.keyState;
          this.type =
            stateOrOptions.keyState === PRESSED ? InputEventTypes.PRESS : InputEventTypes.RELEASE;
        }
        if (stateOrOptions.direction !== undefined) {
          this.direction = stateOrOptions.direction;
        }
      }
    }
  }
}

/**
 * Input Service for handling keyboard and touch input
 */
export default class InputService {
  private static instance: InputService;
  private receivers: Set<InputReceiver>;
  private keyboardState: KeyboardState;
  private inputRouter: InputRouter<InputReceiver>;
  private touchControlsEnabled: boolean;
  private touchButtons: Map<string, { element: HTMLElement; pressed: boolean }>;
  private virtualJoystick: {
    element: HTMLElement;
    centerPos: Vec2;
    currentPos: Vec2;
    active: boolean;
  } | null;
  private pauseHandler: (() => void) | null;
  private keysPressed: Set<string>; // Track currently pressed keys

  /**
   * Private constructor for singleton
   */
  private constructor() {
    this.receivers = new Set();
    this.keyboardState = new KeyboardState();
    this.inputRouter = new InputRouter();
    this.touchControlsEnabled = false;
    this.touchButtons = new Map();
    this.virtualJoystick = null;
    this.pauseHandler = null;
    this.keysPressed = new Set();

    this.detectTouchDevice();
  }

  /**
   * Get singleton instance
   * @returns InputService
   */
  public static getInstance(): InputService {
    if (!InputService.instance) {
      InputService.instance = new InputService();
    }
    return InputService.instance;
  }

  /**
   * Initialize the service
   * @param window Window object
   */
  public init(window: Window): void {
    this.setupKeyboard();
    this.keyboardState.listenTo(window);

    // Add direct event listeners for keyboard
    window.addEventListener('keydown', (event) => this.handleKeyEvent(event, true));
    window.addEventListener('keyup', (event) => this.handleKeyEvent(event, false));

    // If on a touch device, create touch controls
    if (this.touchControlsEnabled) {
      this.createTouchControls();
    }
  }

  /**
   * Handle keyboard events directly
   * @param event KeyboardEvent
   * @param isDown Whether key is pressed down
   */
  private handleKeyEvent(event: KeyboardEvent, isDown: boolean): void {
    // Get key code
    const { code } = event;

    // Track pressed keys to avoid duplicate events
    if (isDown) {
      if (this.keysPressed.has(code)) {
        return; // Key is already pressed, don't fire duplicate event
      }
      this.keysPressed.add(code);
    } else {
      this.keysPressed.delete(code);
    }

    // Define key mappings for direction and actions
    const keyMappings: Record<string, { type: 'direction' | 'action'; name: string }> = {
      KeyA: { type: 'direction', name: 'left' },
      ArrowLeft: { type: 'direction', name: 'left' },
      KeyD: { type: 'direction', name: 'right' },
      ArrowRight: { type: 'direction', name: 'right' },
      KeyW: { type: 'direction', name: 'up' },
      ArrowUp: { type: 'action', name: 'jump' },
      Space: { type: 'action', name: 'jump' },
      KeyS: { type: 'direction', name: 'down' },
      ArrowDown: { type: 'action', name: 'turbo' },
      ShiftLeft: { type: 'action', name: 'turbo' },
    };

    // Handle mapped keys
    const mapping = keyMappings[code];
    if (mapping) {
      if (mapping.type === 'direction') {
        this.triggerDirectionalInput(mapping.name, isDown);
      } else {
        this.triggerActionInput(mapping.name, isDown);
      }
    }

    // Special case for Escape key
    else if (code === 'Escape') {
      // Only trigger pause on key down to avoid toggling rapidly
      if (isDown && this.pauseHandler) {
        this.pauseHandler();
      }
    }
  }

  /**
   * Setup keyboard controls
   */
  private setupKeyboard(): void {
    // We keep the keyboard mapping through KeyboardState for compatibility,
    // but rely on direct event listeners for better responsiveness
    this.keyboardState.addMapping('KeyP', (keyState: KeyState) => {
      if (keyState) {
        this.inputRouter.route((receiver) => {
          if (receiver.receive) {
            receiver.receive(new GameInputEvent('pause'));
          }
        });
      }
    });

    this.keyboardState.addMapping('Space', (keyState: KeyState) => {
      this.inputRouter.route((receiver) => {
        if (receiver.receive) {
          receiver.receive(new GameInputEvent('jump', keyState));
        }
      });
    });

    this.keyboardState.addMapping('KeyA', (keyState: KeyState) => {
      this.inputRouter.route((receiver) => {
        if (receiver.receive) {
          receiver.receive(new GameInputEvent('move', { direction: -1, keyState }));
        }
      });
    });

    this.keyboardState.addMapping('KeyD', (keyState: KeyState) => {
      this.inputRouter.route((receiver) => {
        if (receiver.receive) {
          receiver.receive(new GameInputEvent('move', { direction: 1, keyState }));
        }
      });
    });

    this.keyboardState.addMapping('KeyW', (keyState: KeyState) => {
      this.inputRouter.route((receiver) => {
        if (receiver.receive) {
          receiver.receive(new GameInputEvent('climb', { direction: -1, keyState }));
        }
      });
    });

    this.keyboardState.addMapping('KeyS', (keyState: KeyState) => {
      this.inputRouter.route((receiver) => {
        if (receiver.receive) {
          receiver.receive(new GameInputEvent('climb', { direction: 1, keyState }));
        }
      });
    });

    this.keyboardState.addMapping('ShiftLeft', (keyState: KeyState) => {
      this.inputRouter.route((receiver) => {
        if (receiver.receive) {
          receiver.receive(new GameInputEvent('turbo', keyState));
        }
      });
    });

    this.keyboardState.addMapping('ArrowRight', (keyState: KeyState) => {
      this.inputRouter.route((receiver) => {
        if (receiver.receive) {
          receiver.receive(new GameInputEvent('move', { direction: 1, keyState }));
        }
      });
    });

    this.keyboardState.addMapping('ArrowLeft', (keyState: KeyState) => {
      this.inputRouter.route((receiver) => {
        if (receiver.receive) {
          receiver.receive(new GameInputEvent('move', { direction: -1, keyState }));
        }
      });
    });

    this.keyboardState.addMapping('ArrowUp', (keyState: KeyState) => {
      this.inputRouter.route((receiver) => {
        if (receiver.receive) {
          receiver.receive(new GameInputEvent('jump', keyState));
        }
      });
    });

    this.keyboardState.addMapping('ArrowDown', (keyState: KeyState) => {
      this.inputRouter.route((receiver) => {
        if (receiver.receive) {
          receiver.receive(new GameInputEvent('turbo', keyState));
        }
      });
    });
  }

  /**
   * Detect if we're on a touch device and create touch controls if needed
   */
  private detectTouchDevice(): void {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      this.touchControlsEnabled = true;
      this.createTouchControls();
    }
  }

  /**
   * Create touch controls
   */
  private createTouchControls(): void {
    // Create container
    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'touch-controls';
    controlsContainer.style.position = 'absolute';
    controlsContainer.style.bottom = '10px';
    controlsContainer.style.left = '0';
    controlsContainer.style.right = '0';
    controlsContainer.style.display = 'flex';
    controlsContainer.style.justifyContent = 'space-between';
    controlsContainer.style.pointerEvents = 'none';

    // Create joystick container (left side)
    const joystickContainer = document.createElement('div');
    joystickContainer.style.width = '120px';
    joystickContainer.style.height = '120px';
    joystickContainer.style.position = 'relative';
    joystickContainer.style.margin = '10px';
    joystickContainer.style.pointerEvents = 'auto';

    // Create joystick
    const joystick = document.createElement('div');
    joystick.style.width = '60px';
    joystick.style.height = '60px';
    joystick.style.borderRadius = '50%';
    joystick.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    joystick.style.border = '2px solid rgba(255, 255, 255, 0.5)';
    joystick.style.position = 'absolute';
    joystick.style.left = '30px';
    joystick.style.top = '30px';
    joystick.style.transform = 'translate(-50%, -50%)';
    joystick.style.transition = 'none';

    joystickContainer.appendChild(joystick);

    // Create joystick background
    const joystickBg = document.createElement('div');
    joystickBg.style.width = '120px';
    joystickBg.style.height = '120px';
    joystickBg.style.borderRadius = '50%';
    joystickBg.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
    joystickBg.style.position = 'absolute';
    joystickBg.style.left = '0';
    joystickBg.style.top = '0';

    joystickContainer.appendChild(joystickBg);
    joystickContainer.appendChild(joystick);

    // Set up joystick
    this.virtualJoystick = {
      element: joystick,
      centerPos: new Vec2(60, 60),
      currentPos: new Vec2(60, 60),
      active: false,
    };

    // Create action buttons container (right side)
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.flexDirection = 'column';
    buttonsContainer.style.margin = '10px';
    buttonsContainer.style.gap = '10px';

    // Create jump button
    const jumpButton = this.createTouchButton('Jump', 'rgba(0, 200, 0, 0.4)', 60, 60);
    jumpButton.style.marginBottom = '10px';

    // Create turbo button
    const turboButton = this.createTouchButton('Turbo', 'rgba(200, 0, 0, 0.4)', 50, 50);

    // Create pause button
    const pauseButton = this.createTouchButton('⏸️', 'rgba(200, 200, 0, 0.4)', 40, 40);
    pauseButton.style.marginTop = 'auto';
    pauseButton.style.fontSize = '16px';

    buttonsContainer.appendChild(jumpButton);
    buttonsContainer.appendChild(turboButton);
    buttonsContainer.appendChild(pauseButton);

    // Store buttons
    this.touchButtons.set('jump', { element: jumpButton, pressed: false });
    this.touchButtons.set('turbo', { element: turboButton, pressed: false });
    this.touchButtons.set('pause', { element: pauseButton, pressed: false });

    // Add components to the container
    controlsContainer.appendChild(joystickContainer);
    controlsContainer.appendChild(buttonsContainer);

    // Add container to the document
    document.body.appendChild(controlsContainer);

    // Setup event listeners
    this.setupTouchListeners(joystickContainer);
  }

  /**
   * Creates a touch button
   */
  private createTouchButton(
    label: string,
    color: string,
    width: number,
    height: number
  ): HTMLElement {
    const button = document.createElement('div');
    button.textContent = label;
    button.style.width = `${width}px`;
    button.style.height = `${height}px`;
    button.style.borderRadius = '50%';
    button.style.backgroundColor = color;
    button.style.border = '2px solid rgba(255, 255, 255, 0.5)';
    button.style.display = 'flex';
    button.style.justifyContent = 'center';
    button.style.alignItems = 'center';
    button.style.color = 'white';
    button.style.fontFamily = 'sans-serif';
    button.style.fontSize = '14px';
    button.style.userSelect = 'none';
    button.style.pointerEvents = 'auto';
    return button;
  }

  /**
   * Setup touch event listeners
   */
  private setupTouchListeners(joystickContainer: HTMLElement): void {
    // Joystick events
    joystickContainer.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.virtualJoystick) {
        this.virtualJoystick.active = true;
        this.handleJoystickMove(e.touches[0].clientX, e.touches[0].clientY, joystickContainer);
      }
    });

    joystickContainer.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (this.virtualJoystick && this.virtualJoystick.active) {
        this.handleJoystickMove(e.touches[0].clientX, e.touches[0].clientY, joystickContainer);
      }
    });

    const endJoystickTouch = () => {
      if (this.virtualJoystick) {
        this.virtualJoystick.active = false;
        this.virtualJoystick.element.style.left = `${this.virtualJoystick.centerPos.x}px`;
        this.virtualJoystick.element.style.top = `${this.virtualJoystick.centerPos.y}px`;
        this.virtualJoystick.currentPos = new Vec2(
          this.virtualJoystick.centerPos.x,
          this.virtualJoystick.centerPos.y
        );

        // Stop movement
        this.inputRouter.route((receiver) => {
          if (receiver.receive) {
            receiver.receive(new GameInputEvent('move', { direction: 0, keyState: RELEASED }));
          }
        });
      }
    };

    joystickContainer.addEventListener('touchend', () => endJoystickTouch());
    joystickContainer.addEventListener('touchcancel', () => endJoystickTouch());

    // Button events
    for (const [action, button] of this.touchButtons.entries()) {
      button.element.addEventListener('touchstart', (e) => {
        e.preventDefault();
        button.pressed = true;
        if (action === 'pause') {
          if (this.pauseHandler) {
            this.pauseHandler();
          }
          this.inputRouter.route((receiver) => {
            if (receiver.receive) {
              receiver.receive(new GameInputEvent('pause'));
            }
          });
        } else {
          this.inputRouter.route((receiver) => {
            if (receiver.receive) {
              receiver.receive(new GameInputEvent(action, PRESSED));
            }
          });
        }
      });

      button.element.addEventListener('touchend', (e) => {
        e.preventDefault();
        button.pressed = false;
        if (action !== 'pause') {
          this.inputRouter.route((receiver) => {
            if (receiver.receive) {
              receiver.receive(new GameInputEvent(action, RELEASED));
            }
          });
        }
      });

      button.element.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        button.pressed = false;
        if (action !== 'pause') {
          this.inputRouter.route((receiver) => {
            if (receiver.receive) {
              receiver.receive(new GameInputEvent(action, RELEASED));
            }
          });
        }
      });
    }
  }

  /**
   * Handle joystick movement
   */
  private handleJoystickMove(
    clientX: number,
    clientY: number,
    joystickContainer: HTMLElement
  ): void {
    if (!this.virtualJoystick) return;

    const rect = joystickContainer.getBoundingClientRect();
    const centerX = rect.left + this.virtualJoystick.centerPos.x;
    const centerY = rect.top + this.virtualJoystick.centerPos.y;

    let dx = clientX - centerX;
    let dy = clientY - centerY;

    // Calculate distance from center
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 40; // Maximum joystick movement radius

    // Limit movement to maxDistance
    if (distance > maxDistance) {
      dx = (dx * maxDistance) / distance;
      dy = (dy * maxDistance) / distance;
    }

    // Update joystick position
    this.virtualJoystick.element.style.left = `${this.virtualJoystick.centerPos.x + dx}px`;
    this.virtualJoystick.element.style.top = `${this.virtualJoystick.centerPos.y + dy}px`;
    this.virtualJoystick.currentPos = new Vec2(
      this.virtualJoystick.centerPos.x + dx,
      this.virtualJoystick.centerPos.y + dy
    );

    // Determine horizontal movement
    if (Math.abs(dx) > 10) {
      // Add a small threshold to prevent accidental movements
      const direction = dx > 0 ? 1 : -1;
      this.inputRouter.route((receiver) => {
        if (receiver.receive) {
          receiver.receive(new GameInputEvent('move', { direction, keyState: PRESSED }));
        }
      });
    } else {
      this.inputRouter.route((receiver) => {
        if (receiver.receive) {
          receiver.receive(new GameInputEvent('move', { direction: 0, keyState: RELEASED }));
        }
      });
    }
  }

  /**
   * Add an input receiver
   * @param receiver Input receiver object
   */
  public addReceiver(receiver: InputReceiver): void {
    this.receivers.add(receiver);
    this.inputRouter.addReceiver(receiver);
  }

  /**
   * Remove an input receiver
   * @param receiver Input receiver
   */
  public removeReceiver(receiver: InputReceiver): void {
    this.receivers.delete(receiver);
    this.inputRouter.dropReceiver(receiver);
  }

  /**
   * Update the input service
   */
  public update(): void {
    // Update touch input if needed
  }

  /**
   * Trigger a directional input event
   * @param direction Direction name ('left', 'right', 'up', 'down')
   * @param pressed Whether button is pressed
   */
  public triggerDirectionalInput(direction: string, pressed: boolean): void {
    const keyState = pressed ? PRESSED : RELEASED;
    let directionValue = 0;

    // Map direction name to numeric value
    switch (direction) {
      case 'left':
        directionValue = -1;
        break;
      case 'right':
        directionValue = 1;
        break;
      case 'up':
        directionValue = -1;
        break;
      case 'down':
        directionValue = 1;
        break;
    }

    // Create events based on direction
    const actionType = direction === 'left' || direction === 'right' ? 'move' : 'climb';

    // Route the event to all receivers
    this.inputRouter.route((receiver) => {
      if (receiver.receive) {
        receiver.receive(new GameInputEvent(actionType, { direction: directionValue, keyState }));
      }
    });
  }

  /**
   * Trigger an action input from touch controls
   * @param action Action type (jump, run)
   * @param pressed Whether the button is pressed or released
   */
  public triggerActionInput(action: string, pressed: boolean): void {
    const keyState: KeyState = pressed ? PRESSED : RELEASED;

    switch (action) {
      case 'jump':
        this.inputRouter.route((receiver) => {
          if (receiver.receive) {
            receiver.receive(new GameInputEvent('jump', keyState));
          }
        });
        break;
      case 'run':
        this.inputRouter.route((receiver) => {
          if (receiver.receive) {
            receiver.receive(new GameInputEvent('turbo', keyState));
          }
        });
        break;
    }
  }

  /**
   * Set a handler for pause button
   * @param handler Function to call when pause button is pressed
   */
  public setPauseHandler(handler: () => void): void {
    this.pauseHandler = handler;
  }
}
