from setuptools import setup, find_packages

package_name = 'cognition'
version = '0.0.1'
install_requires = []
setup(
    name=package_name,
    version=version,
    description='',
    author='Dou Ziyu from Aishu',
    license='Apache 2',
    package_dir={"":'src'},
    packages=find_packages('src'),
    install_requires=install_requires,
    python_requires='>=3.8'
)