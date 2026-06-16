import win32gui

def get_visible_windows():
    def callback(hwnd, windows):
        if win32gui.IsWindowVisible(hwnd) and not win32gui.IsIconic(hwnd):
            title = win32gui.GetWindowText(hwnd)
            rect = win32gui.GetWindowRect(hwnd)
            if title and title != "Program Manager" and title != "DedennePet":
                windows.append({
                    "hwnd": hwnd,
                    "title": title,
                    "rect": rect
                })
        return True
    
    windows = []
    win32gui.EnumWindows(callback, windows)
    return windows

def get_floor_y_for_rect(pet_rect):
    pet_left, pet_top, pet_right, pet_bottom = pet_rect
    pet_center_x = (pet_left + pet_right) // 2
    
    windows = get_visible_windows()
    highest_floor_y = None
    
    for w in windows:
        w_left, w_top, w_right, w_bottom = w["rect"]
        # Allow pet to stand if its center is within the width of the window
        if w_left <= pet_center_x <= w_right:
            # Window top acts as a floor for the pet
            if w_top >= pet_bottom - 40: # Allow a small margin
                if highest_floor_y is None or w_top < highest_floor_y:
                    highest_floor_y = w_top
                    
    return highest_floor_y
