from setuptools import setup, find_packages

package_name = 'DataTransform'
version = '0.0.1'
install_requires = ['apache_beam>=2.35.0',
                    'datasets>=1.12.1',
                    'huggingface_hub>=0.4.0',
                    'numpy>=1.19.5',
                    'scikit_learn>=1.0.2',
                    'scipy>=1.7.2',
                    'setuptools>=60.9.3',
                    'transformers>=4.17.0,<=4.21.0',
                    'nlpaug>=1.1.10',
                    'torch>=1.11.0',
                    'jieba-fast>=0.39']
setup(
    name=package_name,
    version=version,
    description='DataTransform is a dataset process framework in Python with powerful multiplatform supporting.',
    author='Dou Ziyu from Aishu',
    license='Apache 2',
    package_dir={"": 'src'},
    packages=find_packages('src'),
    package_data={'': ['*.txt', '*.conf', 'stopwords']},
    install_requires=install_requires,
    python_requires='>=3.8'
)
