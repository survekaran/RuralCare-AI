FROM python:3.10

WORKDIR /usr/src/app

COPY gunicorn.conf.py /gunicorn.conf.py

RUN apt-get update -yqq && \
    apt-get install -yqq --no-install-recommends \
    build-essential autoconf libssl-dev libffi-dev \
    openssl libgl1-mesa-dev libglib2.0-0 libsm6 libxrender1 libxext6 \
    libavdevice-dev libavfilter-dev libopus-dev libvpx-dev libopencv-dev && \
    apt-get clean

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

COPY ./app /usr/src/app/app

CMD sh -c "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"