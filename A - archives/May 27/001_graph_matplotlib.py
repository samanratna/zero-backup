import matplotlib.pyplot as plt
import numpy as np
plt.rcParams['toolbar'] = 'None'

x = np.arange(0, 10, 0.2)
y = np.sin(x)
fig, ax = plt.subplots()
ax.plot(x, y)
plt.show()